export type Todo = {
  id: number;
  title: string;
  status: "open" | "done";
  dueDate: string | null;
  completedAt: string | null;
  listId: number;
};

export type TodoList = {
  id: number;
  title: string;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  todos: Todo[];
};

export type PlanTopic = {
  id: number;
  topic: string;
  category: string;
  targetDate: string | null;
  status: "not_started" | "in_progress" | "done";
  completedAt: string | null;
};

export type LogTopic = { id: number; topic: string; category: string };

export type DailyLog = {
  id: number;
  date: string;
  hours: number;
  notes: string;
  mood: number | null;
  energy: number | null;
  topics: LogTopic[];
};

export type Stats = {
  windowDays: number;
  todos: {
    total: number;
    done: number;
    open: number;
    overdue: number;
    completionPct: number;
    perList: { listId: number; title: string; total: number; done: number; pct: number }[];
    completedPerDay: { date: string; count: number }[];
  };
  plan: {
    total: number;
    done: number;
    inProgress: number;
    pct: number;
    byCategory: { category: string; total: number; done: number; pct: number }[];
    completedPerDay: { date: string; count: number }[];
  };
  study: {
    hoursPerDay: { date: string; hours: number }[];
    totalHoursWindow: number;
    logCount: number;
  };
  streak: number;
};
