import { prisma } from "@/lib/db";
import { currentStreak, lastNDays, toDateString } from "@/lib/dates";

const WINDOW_DAYS = 30;

export async function computeStats() {
  const days = lastNDays(WINDOW_DAYS);
  const windowStart = days[0];

  const [lists, todos, topics, logs] = await Promise.all([
    prisma.todoList.findMany({ where: { archived: false }, select: { id: true, title: true } }),
    prisma.todo.findMany({
      select: { id: true, status: true, completedAt: true, listId: true, dueDate: true },
    }),
    prisma.planTopic.findMany({
      select: { id: true, category: true, status: true, completedAt: true, targetDate: true },
    }),
    prisma.dailyLog.findMany({ select: { date: true, hours: true } }),
  ]);

  // --- To-do completion -------------------------------------------------
  const doneTodos = todos.filter((t) => t.status === "done");
  const todoCompletionPct = pct(doneTodos.length, todos.length);

  const completedPerDay = countBy(
    doneTodos.filter((t) => t.completedAt).map((t) => toDateString(t.completedAt!)),
  );

  const perList = lists.map((list) => {
    const mine = todos.filter((t) => t.listId === list.id);
    const done = mine.filter((t) => t.status === "done").length;
    return { listId: list.id, title: list.title, total: mine.length, done, pct: pct(done, mine.length) };
  });

  const today = toDateString(new Date());
  const overdue = todos.filter((t) => t.status === "open" && t.dueDate && t.dueDate < today).length;

  // --- Study logs --------------------------------------------------------
  const hoursPerDay = Object.fromEntries(days.map((d) => [d, 0]));
  for (const log of logs) {
    if (log.date in hoursPerDay) hoursPerDay[log.date] += log.hours;
  }

  // --- Plan progress ----------------------------------------------------
  const topicsByCategory = new Map<string, { total: number; done: number }>();
  for (const t of topics) {
    const entry = topicsByCategory.get(t.category) ?? { total: 0, done: 0 };
    entry.total++;
    if (t.status === "done") entry.done++;
    topicsByCategory.set(t.category, entry);
  }
  const planByCategory = [...topicsByCategory.entries()].map(([category, v]) => ({
    category,
    ...v,
    pct: pct(v.done, v.total),
  }));

  const doneTopics = topics.filter((t) => t.status === "done");
  const topicsCompletedPerDay = countBy(
    doneTopics.filter((t) => t.completedAt).map((t) => toDateString(t.completedAt!)),
  );

  // --- Streak: a day is "active" if you finished a to-do or logged study time
  const activeDays = new Set<string>([
    ...Object.keys(completedPerDay),
    ...logs.filter((l) => l.hours > 0).map((l) => l.date),
    ...Object.keys(topicsCompletedPerDay),
  ]);

  return {
    windowDays: WINDOW_DAYS,
    todos: {
      total: todos.length,
      done: doneTodos.length,
      open: todos.length - doneTodos.length,
      overdue,
      completionPct: todoCompletionPct,
      perList,
      completedPerDay: days.map((d) => ({ date: d, count: completedPerDay[d] ?? 0 })),
    },
    plan: {
      total: topics.length,
      done: doneTopics.length,
      inProgress: topics.filter((t) => t.status === "in_progress").length,
      pct: pct(doneTopics.length, topics.length),
      byCategory: planByCategory,
      completedPerDay: days.map((d) => ({ date: d, count: topicsCompletedPerDay[d] ?? 0 })),
    },
    study: {
      hoursPerDay: days.map((d) => ({ date: d, hours: round1(hoursPerDay[d]) })),
      totalHoursWindow: round1(days.reduce((sum, d) => sum + hoursPerDay[d], 0)),
      logCount: logs.filter((l) => l.date >= windowStart).length,
    },
    streak: currentStreak(activeDays),
  };
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function countBy(values: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}
