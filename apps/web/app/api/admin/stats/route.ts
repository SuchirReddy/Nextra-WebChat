import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { adminService } from "@/server/services/admin-service";

export async function GET(req: NextRequest) {
  try {
    if (!rateLimit(`admin_stats:${requestIp(req)}`, 40, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    await adminService.requireAdmin(user.id);

    const [stats, moderation] = await Promise.all([adminService.stats(), adminService.moderationSnapshot()]);
    return ok({ stats, moderation });
  } catch (error) {
    return handleRouteError(error);
  }
}
