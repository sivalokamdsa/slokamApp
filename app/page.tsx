"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Card, ErrorText, ProgressBar, Stat } from "@/components/ui";
import type { Stats } from "@/lib/types";

// Recharts needs the browser, so load the chart components client-side only.
const CompletionChart = dynamic(() => import("@/components/dashboard-charts").then((m) => m.CompletionChart), { ssr: false });
const HoursChart = dynamic(() => import("@/components/dashboard-charts").then((m) => m.HoursChart), { ssr: false });
const CategoryChart = dynamic(() => import("@/components/dashboard-charts").then((m) => m.CategoryChart), { ssr: false });

export default function DashboardPage() {
  const { data: stats, error, isLoading } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Could not load statistics");
      return res.json();
    },
  });

  if (isLoading) return <p className="text-muted">Loading statistics…</p>;
  if (error || !stats) return <ErrorText error={error ?? new Error("No data")} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Day streak" value={`${stats.streak} 🔥`} hint="Days with progress" />
        <Stat
          label="To-do completion"
          value={`${stats.todos.completionPct}%`}
          hint={`${stats.todos.done} of ${stats.todos.total} done · ${stats.todos.overdue} overdue`}
        />
        <Stat
          label="FDE plan progress"
          value={`${stats.plan.pct}%`}
          hint={`${stats.plan.done} of ${stats.plan.total} topics done`}
        />
        <Stat
          label={`Study hours (${stats.windowDays}d)`}
          value={stats.study.totalHoursWindow}
          hint={`${stats.study.logCount} logs`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Completions per day (last 30 days)">
          <CompletionChart stats={stats} />
        </Card>
        <Card title="Study hours per day (last 30 days)">
          <HoursChart stats={stats} />
        </Card>
        <Card title="FDE plan by category">
          <CategoryChart stats={stats} />
        </Card>
        <Card title="Progress by to-do list">
          {stats.todos.perList.length === 0 && <p className="text-sm text-muted">No active lists.</p>}
          <div className="space-y-4">
            {stats.todos.perList.map((l) => (
              <ProgressBar key={l.listId} label={`${l.title} (${l.done}/${l.total})`} pct={l.pct} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
