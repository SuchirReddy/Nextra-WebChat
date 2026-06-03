import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { adminService } from "@/server/services/admin-service";

const schema = z.object({ banned: z.boolean() });

export async function POST(req: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    if (!rateLimit(`admin_ban:${requestIp(req)}`, 30, 60_000)) {
      return fail("Too many requests", 429);
    }

    const admin = await requireUser();
    await adminService.requireAdmin(admin.id);

    const { userId } = await context.params;
    const payload = schema.parse(await req.json());
    if (admin.id === userId && payload.banned) {
      return fail("You cannot ban your own admin account", 400);
    }

    const updated = await adminService.setUserBanState(userId, payload.banned);
    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
