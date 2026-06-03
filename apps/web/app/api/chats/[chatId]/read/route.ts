import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { chatService } from "@/server/services/chat-service";
import { readReceiptSchema } from "@/server/validators/chat";

export async function POST(req: NextRequest, context: { params: Promise<{ chatId: string }> }) {
  try {
    if (!rateLimit(`read:${requestIp(req)}`, 180, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const { chatId } = await context.params;

    // Try to parse a messageId; if none provided, mark ALL messages in the chat as read
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is fine — we'll mark all messages as read
    }

    const parsed = readReceiptSchema.safeParse(body);
    if (parsed.success) {
      await chatService.markRead(user.id, chatId, parsed.data.messageId);
    } else {
      await chatService.markAllRead(user.id, chatId);
    }

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
