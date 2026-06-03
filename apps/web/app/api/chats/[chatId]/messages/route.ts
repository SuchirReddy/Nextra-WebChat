import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { chatService } from "@/server/services/chat-service";
import { messageInputSchema } from "@/server/validators/chat";

export async function GET(req: NextRequest, context: { params: Promise<{ chatId: string }> }) {
  try {
    if (!rateLimit(`messages_get:${requestIp(req)}`, 120, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const { chatId } = await context.params;

    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || "30"), 100);
    const before = req.nextUrl.searchParams.get("before") || undefined;

    const messages = await chatService.listMessages(chatId, user.id, limit, before);
    return ok(messages);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ chatId: string }> }) {
  try {
    if (!rateLimit(`messages_post:${requestIp(req)}`, 90, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const { chatId } = await context.params;
    const payload = messageInputSchema.parse(await req.json());

    const message = await chatService.sendMessage(user.id, {
      chatId,
      ...payload
    });

    return ok(message, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
