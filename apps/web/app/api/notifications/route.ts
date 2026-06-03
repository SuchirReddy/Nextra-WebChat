import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/drizzle/schema";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { userRepo } from "@/server/repos/user-repo";

export async function GET(req: NextRequest) {
  try {
    if (!rateLimit(`notifications:${requestIp(req)}`, 120, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const [items, unreadCount] = await Promise.all([
      userRepo.listNotifications(user.id),
      userRepo.unreadNotificationCount(user.id)
    ]);

    return ok({ items, unreadCount });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!rateLimit(`notifications_patch:${requestIp(req)}`, 60, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.userId, user.id));

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
