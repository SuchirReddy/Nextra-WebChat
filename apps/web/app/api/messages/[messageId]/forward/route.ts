import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { chatService } from "@/server/services/chat-service";

const schema = z.object({ chatId: z.string().uuid() });

export async function POST(req: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  try {
    if (!rateLimit(`message_forward:${requestIp(req)}`, 60, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const { messageId } = await context.params;
    const { chatId } = schema.parse(await req.json());

    const forwarded = await chatService.forwardMessage(user.id, messageId, chatId);
    return ok(forwarded, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
