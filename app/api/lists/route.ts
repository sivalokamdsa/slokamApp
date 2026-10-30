import { prisma } from "@/lib/db";
import { badRequest, readJson, serverError } from "@/lib/api-response";
import { listCreateSchema, parseBody } from "@/lib/validation";


// GET /api/lists?archived=true|false (omit for all lists)
export async function GET(req: Request) {
  try {
    const archivedParam = new URL(req.url).searchParams.get("archived");
    const where =
      archivedParam === null ? {} : { archived: archivedParam === "true" };

    const lists = await prisma.todoList.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { todos: { orderBy: { id: "asc" } } },
    });
    return Response.json(lists);
  } catch (err) {
    return serverError(err);
  }
}

// POST /api/lists  { title }
export async function POST(req: Request) {
  try {
    const parsed = parseBody(listCreateSchema, await readJson(req));
    if (!parsed.ok) return badRequest(parsed.message);

    const list = await prisma.todoList.create({
      data: { title: parsed.data.title },
      include: { todos: true },
    });
    return Response.json(list, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
