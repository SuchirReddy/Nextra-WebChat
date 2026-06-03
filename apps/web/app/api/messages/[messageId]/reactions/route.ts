import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { chatService } from "@/server/services/chat-service";
import { reactionSchema } from "@/server/validators/chat";

export async function POST(req: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  try {
    if (!rateLimit(`reaction_post:${requestIp(req)}`, 120, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const { messageId } = await context.params;
    const { emoji } = reactionSchema.parse(await req.json());

    const reaction = await chatService.addReaction(user.id, messageId, emoji);
    return ok(reaction, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  try {
    if (!rateLimit(`reaction_delete:${requestIp(req)}`, 120, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const { messageId } = await context.params;
    const { emoji } = reactionSchema.parse(await req.json());

    await chatService.removeReaction(user.id, messageId, emoji);
    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
