import { connection } from "next/server";
import { computeStats } from "@/lib/stats";
import { serverError } from "@/lib/api-response";


// GET /api/stats
export async function GET() {
  // Must sit outside try/catch: connection() signals Next.js to render at request time.
  await connection();
  try {
    return Response.json(await computeStats());
  } catch (err) {
    return serverError(err);
  }
}
