"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, ErrorText, Input, ProgressBar } from "@/components/ui";
import { del, patch, post } from "@/lib/api-client";
import type { TodoList } from "@/lib/types";
import { todayString } from "@/lib/dates";

export default function TodosPage() {
  const qc = useQueryClient();
  const { data: lists, error, isLoading } = useQuery<TodoList[]>({
    queryKey: ["lists", "active"],
    queryFn: () => fetch("/api/lists?archived=false").then((r) => r.json()),
  });

  // Every change can affect stats and the other lists, so refresh everything.
  const refresh = () => qc.invalidateQueries();
  const createList = useMutation({
    mutationFn: (title: string) => post("/api/lists", { title }),
    onSuccess: refresh,
  });

  const [newTitle, setNewTitle] = useState("");
  const submitList = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createList.mutate(newTitle, { onSuccess: () => setNewTitle("") });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">To-do lists</h1>
        <form onSubmit={submitList} className="flex gap-2">
          <Input
            placeholder="New list name, e.g. Week 1 – Kafka"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-64"
          />
          <Button type="submit" disabled={createList.isPending}>Add list</Button>
        </form>
      </div>
      <ErrorText error={createList.error} />

      {isLoading && <p className="text-muted">Loading…</p>}
      <ErrorText error={error} />
      {lists?.length === 0 && <p className="text-muted">No lists yet. Create one above.</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {lists?.map((list) => (
          <ListCard key={list.id} list={list} onChange={refresh} />
        ))}
      </div>
    </div>
  );
}

function ListCard({ list, onChange }: { list: TodoList; onChange: () => void }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  const addTodo = useMutation({
    mutationFn: () =>
      post("/api/todos", { title, listId: list.id, dueDate: due || null }),
    onSuccess: () => {
      setTitle("");
      setDue("");
      onChange();
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "open" | "done" }) =>
      patch(`/api/todos/${id}`, { status }),
    onSuccess: onChange,
  });

  const removeTodo = useMutation({
    mutationFn: (id: number) => del(`/api/todos/${id}`),
    onSuccess: onChange,
  });

  const archive = useMutation({
    mutationFn: () => patch(`/api/lists/${list.id}`, { archived: true }),
    onSuccess: onChange,
  });

  const removeList = useMutation({
    mutationFn: () => del(`/api/lists/${list.id}`),
    onSuccess: onChange,
  });

  const done = list.todos.filter((t) => t.status === "done").length;
  const pct = list.todos.length ? Math.round((done / list.todos.length) * 100) : 0;
  const today = todayString();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim()) addTodo.mutate();
  };

  return (
    <Card
      title={list.title}
      action={
        <div className="flex gap-1">
          <Button variant="ghost" onClick={() => archive.mutate()} disabled={archive.isPending}>
            Archive
          </Button>
          <Button variant="danger" onClick={() => {
            if (window.confirm(`Delete "${list.title}" and its to-dos?`)) removeList.mutate();
          }}>
            Delete
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        <ProgressBar pct={pct} label={`${done} of ${list.todos.length} done`} />
      </div>

      <ul className="mb-4 space-y-2">
        {list.todos.map((todo) => {
          const overdue = todo.status === "open" && todo.dueDate && todo.dueDate < today;
          return (
            <li key={todo.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-indigo-600"
                checked={todo.status === "done"}
                onChange={(e) => toggle.mutate({ id: todo.id, status: e.target.checked ? "done" : "open" })}
              />
              <span className={`flex-1 text-sm ${todo.status === "done" ? "line-through text-muted" : ""}`}>
                {todo.title}
              </span>
              {todo.dueDate && (
                <span className={`text-xs ${overdue ? "font-medium text-red-600" : "text-muted"}`}>
                  {overdue ? "Overdue · " : ""}
                  {todo.dueDate}
                </span>
              )}
              <button
                className="text-xs text-muted hover:text-red-600"
                onClick={() => removeTodo.mutate(todo.id)}
                aria-label={`Delete ${todo.title}`}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <Input placeholder="Add a to-do" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <Button type="submit" disabled={addTodo.isPending}>Add</Button>
      </form>
      <ErrorText error={addTodo.error ?? toggle.error ?? removeTodo.error ?? archive.error ?? removeList.error} />
    </Card>
  );
}
