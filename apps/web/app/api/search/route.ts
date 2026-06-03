import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { chatRepo } from "@/server/repos/chat-repo";
import { searchSchema } from "@/server/validators/chat";

export async function GET(req: NextRequest) {
  try {
    if (!rateLimit(`search:${requestIp(req)}`, 100, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const query = searchSchema.parse({ q: req.nextUrl.searchParams.get("q") }).q;

    const [users, chats, messages] = await Promise.all([
      chatRepo.searchUsers(query, user.id),
      chatRepo.searchChats(query, user.id),
      chatRepo.searchMessages(query, user.id)
    ]);

    return ok({ users, chats, messages });
  } catch (error) {
    return handleRouteError(error);
  }
}
