import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, users } from "@/drizzle/schema";

export const userRepo = {
  getById: async (id: string) => {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  },

  getByClerkId: async (clerkId: string) => {
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    return user;
  },

  updateProfile: async (id: string, payload: { username: string; bio?: string; avatarUrl?: string }) => {
    const [updated] = await db
      .update(users)
      .set({
        username: payload.username,
        bio: payload.bio,
        avatarUrl: payload.avatarUrl,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();

    return updated;
  },

  setPresence: async (id: string, isOnline: boolean) => {
    await db
      .update(users)
      .set({
        isOnline,
        lastSeenAt: isOnline ? null : new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  },

  listNotifications: async (userId: string) =>
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50),

  unreadNotificationCount: async (userId: string) => {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    return Number(row?.count ?? 0);
  }
};
