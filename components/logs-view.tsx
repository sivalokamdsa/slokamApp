"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, ErrorText, Input } from "@/components/ui";
import { del, post } from "@/lib/api-client";
import { todayString, toDateString } from "@/lib/dates";
import type { DailyLog, PlanTopic } from "@/lib/types";

// Rendered only in the browser (see app/logs/page.tsx), so reading today's date
// during render is safe and matches the visitor's clock.
export default function LogsView() {
  const qc = useQueryClient();
  const logs = useQuery<DailyLog[]>({
    queryKey: ["logs"],
    queryFn: () => fetch("/api/logs").then((r) => r.json()),
  });
  const topics = useQuery<PlanTopic[]>({
    queryKey: ["plan-topics"],
    queryFn: () => fetch("/api/plan-topics").then((r) => r.json()),
  });

  const [date, setDate] = useState(() => todayString());
  const [hours, setHours] = useState("");
  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState("");
  const [notes, setNotes] = useState("");
  const [topicIds, setTopicIds] = useState<number[]>([]);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());

  const create = useMutation({
    mutationFn: () =>
      post("/api/logs", {
        date,
        hours: Number(hours || 0),
        mood: mood ? Number(mood) : null,
        energy: energy ? Number(energy) : null,
        notes,
        topicIds,
      }),
    onSuccess: () => {
      setHours("");
      setMood("");
      setEnergy("");
      setNotes("");
      setTopicIds([]);
      qc.invalidateQueries();
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => del(`/api/logs/${id}`),
    onSuccess: () => qc.invalidateQueries(),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };

  const toggleTopic = (id: number) =>
    setTopicIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Daily logs</h1>

      <Card title="Log today's study">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Date
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Hours studied
            <Input type="number" min={0} max={24} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Mood (1–5)
            <Input type="number" min={1} max={5} value={mood} onChange={(e) => setMood(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Energy (1–5)
            <Input type="number" min={1} max={5} value={energy} onChange={(e) => setEnergy(e.target.value)} />
          </label>
          <div className="md:col-span-2">
            <p className="mb-1 text-sm">Topics studied</p>
            {topics.data?.length === 0 && (
              <p className="text-xs text-muted">Add topics on the FDE Plan page to link them here.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {topics.data?.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggleTopic(t.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    topicIds.includes(t.id) ? "border-accent bg-accent/15 text-accent" : "border-border text-muted"
                  }`}
                >
                  {t.topic}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={create.isPending}>Save log</Button>
            <ErrorText error={create.error} />
          </div>
        </form>
      </Card>

      <Card title="Calendar">
        <MonthCalendar
          month={visibleMonth}
          logs={logs.data ?? []}
          onMonthChange={setVisibleMonth}
          onPickDate={(d) => setDate(d)}
        />
      </Card>

      <Card title="History">
        <ErrorText error={logs.error ?? remove.error} />
        {logs.data?.length === 0 && <p className="text-sm text-muted">No logs yet.</p>}
        <ul className="divide-y divide-border">
          {logs.data?.map((log) => (
            <li key={log.id} className="flex items-start gap-4 py-3">
              <div className="w-28 shrink-0 text-sm font-medium">{log.date}</div>
              <div className="flex-1 text-sm">
                <p>
                  {log.hours}h
                  {log.mood !== null && <span className="ml-3 text-muted">mood {log.mood}/5</span>}
                  {log.energy !== null && <span className="ml-3 text-muted">energy {log.energy}/5</span>}
                </p>
                {log.topics.length > 0 && (
                  <p className="mt-1 text-xs text-accent">{log.topics.map((t) => t.topic).join(" · ")}</p>
                )}
                {log.notes && <p className="mt-1 whitespace-pre-wrap text-muted">{log.notes}</p>}
              </div>
              <button className="text-xs text-muted hover:text-red-600" onClick={() => remove.mutate(log.id)} aria-label={`Delete log ${log.date}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function MonthCalendar({
  month,
  logs,
  onMonthChange,
  onPickDate,
}: {
  month: Date;
  logs: DailyLog[];
  onMonthChange: (d: Date) => void;
  onPickDate: (d: string) => void;
}) {
  const hoursByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of logs) map.set(l.date, (map.get(l.date) ?? 0) + l.hours);
    return map;
  }, [logs]);

  const year = month.getFullYear();
  const m = month.getMonth();
  const firstWeekday = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateString(new Date(year, m, i + 1))),
  ];
  const today = todayString();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" onClick={() => onMonthChange(new Date(year, m - 1, 1))}>←</Button>
        <span className="font-medium">{month.toLocaleString(undefined, { month: "long", year: "numeric" })}</span>
        <Button variant="ghost" onClick={() => onMonthChange(new Date(year, m + 1, 1))}>→</Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1 text-muted">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const hours = hoursByDate.get(d) ?? 0;
          const shade = hours >= 3 ? "bg-indigo-600 text-white" : hours > 0 ? "bg-indigo-300/60" : "bg-border/40";
          return (
            <button
              type="button"
              key={d}
              onClick={() => onPickDate(d)}
              title={`${d}: ${hours}h`}
              className={`rounded-md py-2 ${shade} ${d === today ? "ring-2 ring-accent" : ""}`}
            >
              {Number(d.slice(8))}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">Click a day to log it. Darker = more hours studied.</p>
    </div>
  );
}
