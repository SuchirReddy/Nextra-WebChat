import { auth, clerkClient } from "@clerk/nextjs/server";
import { ApiError } from "@/lib/errors";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const requireUser = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new ApiError("Unauthorized", 401);
  }

  const [dbUser] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
  if (dbUser) {
    if (dbUser.role === "banned") {
      throw new ApiError("Account is banned", 403);
    }
    return dbUser;
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);

  const [created] = await db
    .insert(users)
    .values({
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? `${userId}@local.dev`,
      username:
        clerkUser.username ??
        (clerkUser.firstName 
          ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim() + ` (${userId.slice(0, 4).toUpperCase()})`
          : `User (${userId.slice(0, 6).toUpperCase()})`),
      avatarUrl: clerkUser.imageUrl,
      bio: ""
    })
    .onConflictDoNothing()
    .returning();

  if (!created) {
    const [retried] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
    if (!retried) {
      throw new ApiError("Unable to sync user", 500);
    }
    if (retried.role === "banned") {
      throw new ApiError("Account is banned", 403);
    }
    return retried;
  }

  return created;
};
