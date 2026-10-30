import { prisma } from "@/lib/db";
import { badRequest, notFound, readJson, serverError } from "@/lib/api-response";
import { listUpdateSchema, parseBody, parseId } from "@/lib/validation";


type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const id = parseId((await ctx.params).id);
    if (!id) return badRequest("Invalid id");

    const list = await prisma.todoList.findUnique({
      where: { id },
      include: { todos: { orderBy: { id: "asc" } } },
    });
    return list ? Response.json(list) : notFound("List not found");
  } catch (err) {
    return serverError(err);
  }
}

// PATCH /api/lists/:id  { title?, archived? }
// Archiving stamps archivedAt; un-archiving clears it.
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const id = parseId((await ctx.params).id);
    if (!id) return badRequest("Invalid id");

    const parsed = parseBody(listUpdateSchema, await readJson(req));
    if (!parsed.ok) return badRequest(parsed.message);

    const data: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.archived !== undefined) {
      data.archived = parsed.data.archived;
      data.archivedAt = parsed.data.archived ? new Date() : null;
    }

    const list = await prisma.todoList.update({
      where: { id },
      data,
      include: { todos: { orderBy: { id: "asc" } } },
    }).catch(() => null);
    return list ? Response.json(list) : notFound("List not found");
  } catch (err) {
    return serverError(err);
  }
}

// DELETE /api/lists/:id  (also deletes its to-dos)
export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const id = parseId((await ctx.params).id);
    if (!id) return badRequest("Invalid id");

    const deleted = await prisma.todoList.delete({ where: { id } }).catch(() => null);
    return deleted ? new Response(null, { status: 204 }) : notFound("List not found");
  } catch (err) {
    return serverError(err);
  }
}
