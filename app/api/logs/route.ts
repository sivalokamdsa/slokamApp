import { prisma } from "@/lib/db";
import { badRequest, readJson, serverError } from "@/lib/api-response";
import { dailyLogSchema, parseBody } from "@/lib/validation";


// GET /api/logs?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const logs = await prisma.dailyLog.findMany({
      where: {
        ...(from || to
          ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
          : {}),
      },
      orderBy: [{ date: "desc" }, { id: "desc" }],
      include: { topics: { select: { id: true, topic: true, category: true } } },
    });
    return Response.json(logs);
  } catch (err) {
    return serverError(err);
  }
}

// POST /api/logs  { date, hours, notes?, mood?, energy?, topicIds? }
export async function POST(req: Request) {
  try {
    const parsed = parseBody(dailyLogSchema, await readJson(req));
    if (!parsed.ok) return badRequest(parsed.message);
    const { topicIds, ...fields } = parsed.data;

    const log = await prisma.dailyLog.create({
      data: {
        ...fields,
        mood: fields.mood ?? null,
        energy: fields.energy ?? null,
        topics: { connect: topicIds.map((id) => ({ id })) },
      },
      include: { topics: { select: { id: true, topic: true, category: true } } },
    });
    return Response.json(log, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
