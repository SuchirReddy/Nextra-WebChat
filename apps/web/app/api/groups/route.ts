import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { chatService } from "@/server/services/chat-service";
import { createGroupSchema } from "@/server/validators/chat";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`group_create:${requestIp(req)}`, 20, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const payload = createGroupSchema.parse(await req.json());

    const group = await chatService.createGroup({
      creatorId: user.id,
      ...payload
    });

    return ok(group, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
