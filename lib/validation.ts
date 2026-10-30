import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .nullable()
  .optional();

export const listCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export const listUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  archived: z.boolean().optional(),
});

export const todoCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  listId: z.number().int().positive(),
  dueDate: dateString,
});

export const todoUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  status: z.enum(["open", "done"]).optional(),
  dueDate: dateString,
});

export const planTopicCreateSchema = z.object({
  topic: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(80),
  targetDate: dateString,
});

export const planTopicUpdateSchema = z.object({
  topic: z.string().trim().min(1).max(200).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  targetDate: dateString,
  status: z.enum(["not_started", "in_progress", "done"]).optional(),
});

export const dailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  hours: z.number().min(0).max(24),
  notes: z.string().max(5000).default(""),
  mood: z.number().int().min(1).max(5).nullable().optional(),
  energy: z.number().int().min(1).max(5).nullable().optional(),
  topicIds: z.array(z.number().int().positive()).default([]),
});

export const dailyLogUpdateSchema = dailyLogSchema.partial();

export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join("; ");
    return { ok: false as const, message };
  }
  return { ok: true as const, data: result.data as z.infer<T> };
}

export function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}
