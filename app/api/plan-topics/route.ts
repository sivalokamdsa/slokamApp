import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, readJson, serverError } from "@/lib/api-response";
import { parseBody, planTopicCreateSchema } from "@/lib/validation";


// GET /api/plan-topics
export async function GET() {
  // Must sit outside try/catch: connection() signals Next.js to render at request time.
  await connection();
  try {
    const topics = await prisma.planTopic.findMany({
      orderBy: [{ category: "asc" }, { targetDate: "asc" }, { id: "asc" }],
    });
    return Response.json(topics);
  } catch (err) {
    return serverError(err);
  }
}

// POST /api/plan-topics  { topic, category, targetDate? }
export async function POST(req: Request) {
  try {
    const parsed = parseBody(planTopicCreateSchema, await readJson(req));
    if (!parsed.ok) return badRequest(parsed.message);

    const topic = await prisma.planTopic.create({
      data: {
        topic: parsed.data.topic,
        category: parsed.data.category,
        targetDate: parsed.data.targetDate ?? null,
      },
    });
    return Response.json(topic, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
