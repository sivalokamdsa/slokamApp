"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, ErrorText, ProgressBar } from "@/components/ui";
import { patch } from "@/lib/api-client";
import type { TodoList } from "@/lib/types";

export default function ArchivePage() {
  const qc = useQueryClient();
  const { data: lists, error, isLoading } = useQuery<TodoList[]>({
    queryKey: ["lists", "archived"],
    queryFn: () => fetch("/api/lists?archived=true").then((r) => r.json()),
  });

  const restore = useMutation({
    mutationFn: (id: number) => patch(`/api/lists/${id}`, { archived: false }),
    onSuccess: () => qc.invalidateQueries(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Archive</h1>
      <p className="text-sm text-muted">
        Archived lists are kept for review. Restore one to work on it again.
      </p>
      <ErrorText error={error ?? restore.error} />
      {isLoading && <p className="text-muted">Loading…</p>}
      {lists?.length === 0 && <p className="text-muted">Nothing archived yet.</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {lists?.map((list) => {
          const done = list.todos.filter((t) => t.status === "done").length;
          const pct = list.todos.length ? Math.round((done / list.todos.length) * 100) : 0;
          return (
            <Card
              key={list.id}
              title={list.title}
              action={
                <Button variant="ghost" onClick={() => restore.mutate(list.id)} disabled={restore.isPending}>
                  Restore
                </Button>
              }
            >
              <p className="mb-3 text-xs text-muted">
                Archived {list.archivedAt ? new Date(list.archivedAt).toLocaleDateString() : ""}
              </p>
              <ProgressBar pct={pct} label={`${done} of ${list.todos.length} done`} />
              <ul className="mt-4 space-y-1 text-sm">
                {list.todos.map((t) => (
                  <li key={t.id} className={t.status === "done" ? "text-muted line-through" : ""}>
                    {t.status === "done" ? "✓" : "○"} {t.title}
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
