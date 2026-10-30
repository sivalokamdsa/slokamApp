"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Stats } from "@/lib/types";

const tick = { fontSize: 11, fill: "var(--muted)" };
const shortDate = (d: string) => d.slice(5); // "MM-DD"

export function CompletionChart({ stats }: { stats: Stats }) {
  const data = stats.todos.completedPerDay.map((t, i) => ({
    date: shortDate(t.date),
    todos: t.count,
    topics: stats.plan.completedPerDay[i]?.count ?? 0,
  }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={tick} interval={4} />
        <YAxis allowDecimals={false} tick={tick} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="todos" name="To-dos done" stroke="#4f46e5" dot={false} />
        <Line type="monotone" dataKey="topics" name="Plan topics done" stroke="#10b981" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HoursChart({ stats }: { stats: Stats }) {
  const data = stats.study.hoursPerDay.map((d) => ({ date: shortDate(d.date), hours: d.hours }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={tick} interval={4} />
        <YAxis tick={tick} />
        <Tooltip />
        <Bar dataKey="hours" name="Study hours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({ stats }: { stats: Stats }) {
  const data = stats.plan.byCategory.map((c) => ({ category: c.category, done: c.done, remaining: c.total - c.done }));
  if (data.length === 0) return <p className="text-sm text-muted">No plan topics yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" allowDecimals={false} tick={tick} />
        <YAxis type="category" dataKey="category" width={130} tick={tick} />
        <Tooltip />
        <Legend />
        <Bar dataKey="done" name="Done" stackId="a" fill="#10b981" />
        <Bar dataKey="remaining" name="Remaining" stackId="a" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
