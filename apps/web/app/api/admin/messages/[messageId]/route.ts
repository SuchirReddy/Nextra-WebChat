import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { adminService } from "@/server/services/admin-service";

export async function DELETE(req: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  try {
    if (!rateLimit(`admin_message_delete:${requestIp(req)}`, 60, 60_000)) {
      return fail("Too many requests", 429);
    }

    const admin = await requireUser();
    await adminService.requireAdmin(admin.id);

    const { messageId } = await context.params;
    const deleted = await adminService.deleteMessage(messageId);

    return ok(deleted);
  } catch (error) {
    return handleRouteError(error);
  }
}
