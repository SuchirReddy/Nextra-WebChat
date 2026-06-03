import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { chatRepo } from "@/server/repos/chat-repo";

export async function POST(req: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    if (!rateLimit(`clear_chat:${requestIp(req)}`, 10, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const isMember = await chatRepo.isMember(params.chatId, user.id);
    if (!isMember) {
      return fail("Forbidden", 403);
    }

    await chatRepo.clearChat(params.chatId);

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
