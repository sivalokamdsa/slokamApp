import { prisma } from "@/lib/db";
import { badRequest, notFound, readJson, serverError } from "@/lib/api-response";
import { parseBody, parseId, planTopicUpdateSchema } from "@/lib/validation";


type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/plan-topics/:id
// Setting status "done" stamps completedAt; any other status clears it.
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const id = parseId((await ctx.params).id);
    if (!id) return badRequest("Invalid id");

    const parsed = parseBody(planTopicUpdateSchema, await readJson(req));
    if (!parsed.ok) return badRequest(parsed.message);

    const data: Record<string, unknown> = {};
    if (parsed.data.topic !== undefined) data.topic = parsed.data.topic;
    if (parsed.data.category !== undefined) data.category = parsed.data.category;
    if (parsed.data.targetDate !== undefined) data.targetDate = parsed.data.targetDate;
    if (parsed.data.status !== undefined) {
      data.status = parsed.data.status;
      data.completedAt = parsed.data.status === "done" ? new Date() : null;
    }

    const topic = await prisma.planTopic.update({ where: { id }, data }).catch(() => null);
    return topic ? Response.json(topic) : notFound("Topic not found");
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const id = parseId((await ctx.params).id);
    if (!id) return badRequest("Invalid id");

    const deleted = await prisma.planTopic.delete({ where: { id } }).catch(() => null);
    return deleted ? new Response(null, { status: 204 }) : notFound("Topic not found");
  } catch (err) {
    return serverError(err);
  }
}
