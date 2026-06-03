import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { createSocketToken } from "@/lib/socket-token";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`socket_token:${requestIp(req)}`, 30, 60_000)) {
      return fail("Too many requests", 429);
    }

    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return fail("Unauthorized", 401);
    }

    const user = await requireUser();
    const token = await createSocketToken({ userId: user.id, clerkId });

    return ok({ token });
  } catch (error) {
    return handleRouteError(error);
  }
}
