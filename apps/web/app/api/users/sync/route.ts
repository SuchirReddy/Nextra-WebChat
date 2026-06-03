import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`sync:${requestIp(req)}`, 30, 60_000)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
    }

    const user = await requireUser();
    return ok(user);
  } catch (error) {
    return handleRouteError(error);
  }
}
