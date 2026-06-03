import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { chatRepo } from "@/server/repos/chat-repo";

export async function GET(req: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    if (!rateLimit(`search_chat_messages:${requestIp(req)}`, 30, 60_000)) {
      return fail("Too many requests", 429);
    }

    const url = new URL(req.url);
    const query = url.searchParams.get("q");

    if (!query) {
      return ok([]);
    }

    const user = await requireUser();
    
    // Verify membership
    const isMember = await chatRepo.isMember(params.chatId, user.id);
    if (!isMember) {
      return fail("Forbidden", 403);
    }

    const results = await chatRepo.searchMessages(query, user.id, params.chatId);
    return ok(results);
  } catch (error) {
    return handleRouteError(error);
  }
}
