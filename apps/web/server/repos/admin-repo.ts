import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { attachments, chats, messages, reports, users } from "@/drizzle/schema";

export const adminRepo = {
  stats: async () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [[usersCount], [activeUsers], [messagesCount], [todayMessages], [groupsCount], [openReports]] =
      await Promise.all([
        db.select({ count: count(users.id) }).from(users),
        db.select({ count: count(users.id) }).from(users).where(eq(users.isOnline, true)),
        db.select({ count: count(messages.id) }).from(messages),
        db.select({ count: count(messages.id) }).from(messages).where(gte(messages.createdAt, oneDayAgo)),
        db.select({ count: count(chats.id) }).from(chats).where(eq(chats.type, "group")),
        db.select({ count: count(reports.id) }).from(reports).where(eq(reports.status, "open"))
      ]);

    const messageTrend = await db
      .select({
        day: sql<string>`date_trunc('day', ${messages.createdAt})::date::text`,
        count: count(messages.id)
      })
      .from(messages)
      .where(gte(messages.createdAt, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)))
      .groupBy(sql`date_trunc('day', ${messages.createdAt})`)
      .orderBy(desc(sql`date_trunc('day', ${messages.createdAt})`));

    return {
      usersCount: Number(usersCount.count),
      activeUsers: Number(activeUsers.count),
      messagesCount: Number(messagesCount.count),
      todayMessages: Number(todayMessages.count),
      groupsCount: Number(groupsCount.count),
      openReports: Number(openReports.count),
      messageTrend
    };
  },

  setUserRole: async (userId: string, role: "user" | "admin" | "banned") => {
    const [updated] = await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
    return updated;
  },

  deleteMessage: async (messageId: string) => {
    // Delete associated attachments so inappropriate media is permanently removed
    await db.delete(attachments).where(eq(attachments.messageId, messageId));

    const [deleted] = await db
      .update(messages)
      .set({ body: null, deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(messages.id, messageId))
      .returning();

    return deleted;
  },

  recentUsers: async () => db.select().from(users).orderBy(desc(users.createdAt)).limit(100),

  recentReports: async () => db.select().from(reports).orderBy(desc(reports.createdAt)).limit(50),

  updateReportStatus: async (reportId: string, status: "open" | "in_review" | "resolved" | "dismissed", resolvedById: string) => {
    const [updated] = await db
      .update(reports)
      .set({ status, resolvedById, updatedAt: new Date() })
      .where(eq(reports.id, reportId))
      .returning();
    return updated;
  },

  canModerate: async (userId: string) => {
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    return Boolean(user && (user.role === "admin" || user.role === "banned"));
  },

  isAdmin: async (userId: string) => {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.role, "admin")))
      .limit(1);

    return Boolean(user);
  }
};
