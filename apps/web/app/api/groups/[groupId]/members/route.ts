import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { chatRepo } from "@/server/repos/chat-repo";

const schema = z.object({ userId: z.string().uuid() });

export async function POST(req: NextRequest, context: { params: Promise<{ groupId: string }> }) {
  try {
    if (!rateLimit(`group_member_add:${requestIp(req)}`, 60, 60_000)) {
      return fail("Too many requests", 429);
    }

    const actor = await requireUser();
    const { groupId } = await context.params;
    const { userId } = schema.parse(await req.json());

    const role = await chatRepo.getGroupMemberRole(groupId, actor.id);
    if (role !== "admin") {
      return fail("Only group admins can add members", 403);
    }

    const group = await chatRepo.addGroupMember(groupId, userId);
    if (!group) {
      return fail("Group not found", 404);
    }

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ groupId: string }> }) {
  try {
    if (!rateLimit(`group_member_remove:${requestIp(req)}`, 60, 60_000)) {
      return fail("Too many requests", 429);
    }

    const actor = await requireUser();
    const { groupId } = await context.params;
    const { userId } = schema.parse(await req.json());

    const role = await chatRepo.getGroupMemberRole(groupId, actor.id);
    if (role !== "admin") {
      return fail("Only group admins can remove members", 403);
    }

    await chatRepo.removeGroupMember(groupId, userId);
    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

const patchSchema = z.object({ userId: z.string().uuid(), role: z.enum(["member", "admin"]) });

export async function PATCH(req: NextRequest, context: { params: Promise<{ groupId: string }> }) {
  try {
    if (!rateLimit(`group_member_update:${requestIp(req)}`, 60, 60_000)) {
      return fail("Too many requests", 429);
    }

    const actor = await requireUser();
    const { groupId } = await context.params;
    const { userId, role } = patchSchema.parse(await req.json());

    const actorRole = await chatRepo.getGroupMemberRole(groupId, actor.id);
    if (actorRole !== "admin") {
      return fail("Only group admins can update member roles", 403);
    }

    await chatRepo.updateGroupMemberRole(groupId, userId, role);
    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
