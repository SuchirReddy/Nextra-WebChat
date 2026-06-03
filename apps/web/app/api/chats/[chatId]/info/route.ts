import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { chatService } from "@/server/services/chat-service";

export async function GET(req: NextRequest, props: { params: Promise<{ chatId: string }> }) {
  try {
    if (!rateLimit(`chat_info:${requestIp(req)}`, 60, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const { chatId } = await props.params;

    const info = await chatService.getChatInfo(chatId, user.id);
    return ok(info);
  } catch (error) {
    return handleRouteError(error);
  }
}
