import { prisma } from "@/lib/db";
import { badRequest, notFound, readJson, serverError } from "@/lib/api-response";
import { dailyLogUpdateSchema, parseBody, parseId } from "@/lib/validation";


type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/logs/:id  (any subset of the log fields)
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const id = parseId((await ctx.params).id);
    if (!id) return badRequest("Invalid id");

    const parsed = parseBody(dailyLogUpdateSchema, await readJson(req));
    if (!parsed.ok) return badRequest(parsed.message);
    const { topicIds, ...fields } = parsed.data;

    const log = await prisma.dailyLog
      .update({
        where: { id },
        data: {
          ...fields,
          ...(topicIds !== undefined
            ? { topics: { set: topicIds.map((tid) => ({ id: tid })) } }
            : {}),
        },
        include: { topics: { select: { id: true, topic: true, category: true } } },
      })
      .catch(() => null);
    return log ? Response.json(log) : notFound("Log not found");
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const id = parseId((await ctx.params).id);
    if (!id) return badRequest("Invalid id");

    const deleted = await prisma.dailyLog.delete({ where: { id } }).catch(() => null);
    return deleted ? new Response(null, { status: 204 }) : notFound("Log not found");
  } catch (err) {
    return serverError(err);
  }
}
