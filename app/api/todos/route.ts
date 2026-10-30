import { prisma } from "@/lib/db";
import { badRequest, readJson, serverError } from "@/lib/api-response";
import { parseBody, todoCreateSchema } from "@/lib/validation";


// POST /api/todos  { title, listId, dueDate? }
export async function POST(req: Request) {
  try {
    const parsed = parseBody(todoCreateSchema, await readJson(req));
    if (!parsed.ok) return badRequest(parsed.message);

    const list = await prisma.todoList.findUnique({ where: { id: parsed.data.listId } });
    if (!list) return badRequest("List does not exist");
    if (list.archived) return badRequest("Cannot add to an archived list");

    const todo = await prisma.todo.create({
      data: {
        title: parsed.data.title,
        listId: parsed.data.listId,
        dueDate: parsed.data.dueDate ?? null,
      },
    });
    return Response.json(todo, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
