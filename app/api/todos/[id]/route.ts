import { prisma } from "@/lib/db";
import { badRequest, notFound, readJson, serverError } from "@/lib/api-response";
import { parseBody, parseId, todoUpdateSchema } from "@/lib/validation";


type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/todos/:id  { title?, status?, dueDate? }
// Marking done stamps completedAt (used for statistics); reopening clears it.
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const id = parseId((await ctx.params).id);
    if (!id) return badRequest("Invalid id");

    const parsed = parseBody(todoUpdateSchema, await readJson(req));
    if (!parsed.ok) return badRequest(parsed.message);

    const data: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.dueDate !== undefined) data.dueDate = parsed.data.dueDate;
    if (parsed.data.status !== undefined) {
      data.status = parsed.data.status;
      data.completedAt = parsed.data.status === "done" ? new Date() : null;
    }

    const todo = await prisma.todo.update({ where: { id }, data }).catch(() => null);
    return todo ? Response.json(todo) : notFound("To-do not found");
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const id = parseId((await ctx.params).id);
    if (!id) return badRequest("Invalid id");

    const deleted = await prisma.todo.delete({ where: { id } }).catch(() => null);
    return deleted ? new Response(null, { status: 204 }) : notFound("To-do not found");
  } catch (err) {
    return serverError(err);
  }
}
