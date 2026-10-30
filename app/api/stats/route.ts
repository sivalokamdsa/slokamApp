import { connection } from "next/server";
import { computeStats } from "@/lib/stats";
import { serverError } from "@/lib/api-response";


// GET /api/stats
export async function GET() {
  try {
    await connection(); // opt out of prerendering: this reads live data
    return Response.json(await computeStats());
  } catch (err) {
    return serverError(err);
  }
}
