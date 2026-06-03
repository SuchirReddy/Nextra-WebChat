import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { chatService } from "@/server/services/chat-service";
import { createDirectChatSchema, createGroupSchema } from "@/server/validators/chat";

export async function GET(req: NextRequest) {
  try {
    if (!rateLimit(`chats:${requestIp(req)}`, 80, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const chats = await chatService.listChats(user.id);
    return ok(chats);
  } catch (error) {
    return handleRouteError(error);
  }
}

const createChatSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("direct"), payload: createDirectChatSchema }),
  z.object({ type: z.literal("group"), payload: createGroupSchema })
]);

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`create_chat:${requestIp(req)}`, 20, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const body = createChatSchema.parse(await req.json());

    if (body.type === "direct") {
      const chatId = await chatService.createDirectChat(user.id, body.payload.memberUserId);
      return ok({ chatId }, 201);
    }

    const group = await chatService.createGroup({
      creatorId: user.id,
      ...body.payload
    });

    return ok(group, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
