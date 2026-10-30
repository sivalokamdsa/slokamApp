"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, ErrorText, Input, ProgressBar, Select } from "@/components/ui";
import { del, patch, post } from "@/lib/api-client";
import type { PlanTopic } from "@/lib/types";

const STATUS_LABELS: Record<PlanTopic["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

export default function PlanPage() {
  const qc = useQueryClient();
  const { data: topics, error, isLoading } = useQuery<PlanTopic[]>({
    queryKey: ["plan-topics"],
    queryFn: () => fetch("/api/plan-topics").then((r) => r.json()),
  });

  const refresh = () => qc.invalidateQueries();

  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const create = useMutation({
    mutationFn: () => post("/api/plan-topics", { topic, category, targetDate: targetDate || null }),
    onSuccess: () => {
      setTopic("");
      setTargetDate("");
      refresh();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: PlanTopic["status"] }) =>
      patch(`/api/plan-topics/${id}`, { status }),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: number) => del(`/api/plan-topics/${id}`),
    onSuccess: refresh,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (topic.trim() && category.trim()) create.mutate();
  };

  // Group topics by category for display.
  const groups = new Map<string, PlanTopic[]>();
  for (const t of topics ?? []) {
    groups.set(t.category, [...(groups.get(t.category) ?? []), t]);
  }

  const total = topics?.length ?? 0;
  const done = topics?.filter((t) => t.status === "done").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">FDE preparation plan</h1>
          <p className="text-sm text-muted">
            {done} of {total} topics done
          </p>
        </div>
        <ProgressBar pct={total ? Math.round((done / total) * 100) : 0} />
      </div>

      <Card title="Add a topic">
        <form onSubmit={submit} className="flex flex-wrap gap-2">
          <Input placeholder="Topic, e.g. Kafka consumer groups" value={topic} onChange={(e) => setTopic(e.target.value)} className="flex-1 min-w-48" />
          <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-48" list="categories" />
          <datalist id="categories">
            {[...groups.keys()].map((c) => <option key={c} value={c} />)}
          </datalist>
          <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          <Button type="submit" disabled={create.isPending}>Add topic</Button>
        </form>
        <ErrorText error={create.error} />
      </Card>

      {isLoading && <p className="text-muted">Loading…</p>}
      <ErrorText error={error ?? update.error ?? remove.error} />
      {topics?.length === 0 && <p className="text-muted">No topics yet. Add your first one above.</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {[...groups.entries()].map(([cat, items]) => {
          const catDone = items.filter((t) => t.status === "done").length;
          return (
            <Card key={cat} title={cat}>
              <div className="mb-4">
                <ProgressBar pct={Math.round((catDone / items.length) * 100)} label={`${catDone} of ${items.length} done`} />
              </div>
              <ul className="space-y-3">
                {items.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-2">
                    <span className={`flex-1 text-sm ${t.status === "done" ? "line-through text-muted" : ""}`}>
                      {t.topic}
                      {t.targetDate && <span className="ml-2 text-xs text-muted">by {t.targetDate}</span>}
                    </span>
                    <Select value={t.status} onChange={(e) => update.mutate({ id: t.id, status: e.target.value as PlanTopic["status"] })}>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </Select>
                    <button className="text-xs text-muted hover:text-red-600" onClick={() => remove.mutate(t.id)} aria-label={`Delete ${t.topic}`}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
