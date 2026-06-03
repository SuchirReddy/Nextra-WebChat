import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { chatService } from "@/server/services/chat-service";
import { messageEditSchema } from "@/server/validators/chat";

export async function PATCH(req: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  try {
    if (!rateLimit(`message_patch:${requestIp(req)}`, 60, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const { messageId } = await context.params;
    const { body } = messageEditSchema.parse(await req.json());

    const updated = await chatService.editMessage(user.id, messageId, body);
    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  try {
    if (!rateLimit(`message_delete:${requestIp(req)}`, 60, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const { messageId } = await context.params;

    const deleted = await chatService.deleteMessage(user.id, messageId);
    return ok(deleted);
  } catch (error) {
    return handleRouteError(error);
  }
}
