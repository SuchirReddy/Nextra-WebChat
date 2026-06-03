import { and, desc, eq, ilike, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  attachments,
  chatMembers,
  chats,
  groupMembers,
  groups,
  messageReads,
  messages,
  notifications,
  reactions,
  users
} from "@/drizzle/schema";

export const chatRepo = {
  listChatsForUser: async (userId: string) => {
    const rows = await db
      .select({
        chatId: chats.id,
        chatType: chats.type,
        groupName: groups.name,
        groupAvatar: groups.avatarUrl,
        directMemberId: users.id,
        directMemberName: users.username,
        directMemberAvatar: users.avatarUrl,
        chatLastMessageAt: chats.lastMessageAt
      })
      .from(chatMembers)
      .innerJoin(chats, eq(chats.id, chatMembers.chatId))
      .leftJoin(groups, eq(groups.chatId, chats.id))
      .leftJoin(
        users,
        and(eq(chats.type, "direct"), eq(users.id, sql`(
          select cm2.user_id
          from chat_members cm2
          where cm2.chat_id = ${chats.id} and cm2.user_id != ${userId}
          limit 1
        )`))
      )
      .where(eq(chatMembers.userId, userId))
      .orderBy(desc(chats.lastMessageAt), desc(chats.updatedAt));

    const chatIds = rows.map((r) => r.chatId);
    const unreadByChat = chatIds.length
      ? await db
          .select({
            chatId: messages.chatId,
            unreadCount: sql<number>`count(*)`
          })
          .from(messages)
          .leftJoin(
            messageReads,
            and(eq(messageReads.messageId, messages.id), eq(messageReads.userId, userId))
          )
          .where(and(inArray(messages.chatId, chatIds), isNull(messageReads.messageId), sql`${messages.senderId} != ${userId}`))
          .groupBy(messages.chatId)
      : [];

    const unreadMap = new Map(unreadByChat.map((row) => [row.chatId, Number(row.unreadCount)]));

    const lastMessageRows = chatIds.length
      ? await db
          .select({
            chatId: messages.chatId,
            body: messages.body,
            createdAt: messages.createdAt
          })
          .from(messages)
          .where(inArray(messages.chatId, chatIds))
          .orderBy(desc(messages.createdAt))
      : [];

    const lastMessageMap = new Map<string, { body: string | null; createdAt: Date }>();
    for (const message of lastMessageRows) {
      if (!lastMessageMap.has(message.chatId)) {
        lastMessageMap.set(message.chatId, {
          body: message.body,
          createdAt: message.createdAt
        });
      }
    }

    return rows.map((row) => {
      const title = row.chatType === "group" ? row.groupName ?? "Untitled Group" : row.directMemberName ?? "Unknown";
      const avatarUrl = row.chatType === "group" ? row.groupAvatar : row.directMemberAvatar;
      const last = lastMessageMap.get(row.chatId);
      return {
        id: row.chatId,
        type: row.chatType,
        title,
        avatarUrl,
        lastMessage: last?.body ?? null,
        lastMessageAt: (last?.createdAt ?? row.chatLastMessageAt)?.toISOString() ?? null,
        unreadCount: unreadMap.get(row.chatId) ?? 0
      };
    });
  },

  getChatInfo: async (chatId: string, currentUserId: string) => {
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
    if (!chat) return null;

    if (chat.type === "direct") {
      const [otherMember] = await db
        .select({
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl,
          bio: users.bio,
          isOnline: users.isOnline,
          lastSeenAt: users.lastSeenAt,
          createdAt: users.createdAt
        })
        .from(chatMembers)
        .innerJoin(users, eq(users.id, chatMembers.userId))
        .where(and(eq(chatMembers.chatId, chatId), sql`${chatMembers.userId} != ${currentUserId}`))
        .limit(1);

      return { type: "direct" as const, contact: otherMember };
    } else {
      const [group] = await db
        .select({
          id: groups.id,
          name: groups.name,
          description: groups.description,
          avatarUrl: groups.avatarUrl,
          createdAt: groups.createdAt
        })
        .from(groups)
        .where(eq(groups.chatId, chatId))
        .limit(1);

      if (!group) return null;

      const members = await db
        .select({
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl,
          role: groupMembers.role,
          isOnline: users.isOnline,
          lastSeenAt: users.lastSeenAt
        })
        .from(groupMembers)
        .innerJoin(users, eq(users.id, groupMembers.userId))
        .where(eq(groupMembers.groupId, group.id))
        .orderBy(users.username);

      return { type: "group" as const, group, members };
    }
  },

  createDirectChat: async (currentUserId: string, peerUserId: string) => {
    const existing = await db.execute(sql`
      select c.id
      from chats c
      join chat_members m1 on m1.chat_id = c.id and m1.user_id = ${currentUserId}
      join chat_members m2 on m2.chat_id = c.id and m2.user_id = ${peerUserId}
      where c.type = 'direct'
      limit 1
    `);

    if (existing.length > 0) {
      return existing[0]?.id as string;
    }

    const [chat] = await db
      .insert(chats)
      .values({
        type: "direct",
        createdById: currentUserId,
        lastMessageAt: new Date()
      })
      .returning({ id: chats.id });

    await db.insert(chatMembers).values([
      {
        chatId: chat.id,
        userId: currentUserId,
        role: "member"
      },
      {
        chatId: chat.id,
        userId: peerUserId,
        role: "member"
      }
    ]);

    return chat.id;
  },

  createGroupChat: async (payload: {
    creatorId: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    memberUserIds: string[];
  }) => {
    const [chat] = await db
      .insert(chats)
      .values({
        type: "group",
        createdById: payload.creatorId,
        lastMessageAt: new Date()
      })
      .returning({ id: chats.id });

    const [group] = await db
      .insert(groups)
      .values({
        chatId: chat.id,
        name: payload.name,
        description: payload.description,
        avatarUrl: payload.avatarUrl,
        createdById: payload.creatorId
      })
      .returning({ id: groups.id, chatId: groups.chatId });

    const uniqueMembers = [...new Set([payload.creatorId, ...payload.memberUserIds])];

    await db.insert(chatMembers).values(
      uniqueMembers.map((userId) => ({
        chatId: chat.id,
        userId,
        role: userId === payload.creatorId ? ("admin" as const) : ("member" as const)
      }))
    );

    await db.insert(groupMembers).values(
      uniqueMembers.map((userId) => ({
        groupId: group.id,
        userId,
        role: userId === payload.creatorId ? ("admin" as const) : ("member" as const)
      }))
    );

    return group;
  },

  listMessages: async (chatId: string, limit: number, before?: string) => {
    const rows = await db
      .select({
        id: messages.id,
        chatId: messages.chatId,
        senderId: messages.senderId,
        senderName: users.username,
        senderAvatar: users.avatarUrl,
        body: messages.body,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        editedAt: messages.editedAt,
        deletedAt: messages.deletedAt,
        replyToMessageId: messages.replyToMessageId
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.senderId))
      .where(
        and(
          eq(messages.chatId, chatId),
          before ? lt(messages.createdAt, new Date(before)) : undefined
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    const messageIds = rows.map((row) => row.id);

    const attachmentRows = messageIds.length
      ? await db.select().from(attachments).where(inArray(attachments.messageId, messageIds))
      : [];

    const reactionRows = messageIds.length
      ? await db.select().from(reactions).where(inArray(reactions.messageId, messageIds))
      : [];

    const readRows = messageIds.length
      ? await db.select().from(messageReads).where(inArray(messageReads.messageId, messageIds))
      : [];

    return rows.map((row) => ({
      ...row,
      attachments: attachmentRows.filter((a) => a.messageId === row.id),
      reactions: reactionRows.filter((r) => r.messageId === row.id),
      readBy: readRows.filter((r) => r.messageId === row.id).map((r) => r.userId)
    }));
  },

  insertMessage: async (payload: {
    chatId: string;
    senderId: string;
    body?: string;
    replyToMessageId?: string;
    attachments?: Array<{
      type: "image" | "file";
      url: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
    }>;
  }) => {
    const [message] = await db
      .insert(messages)
      .values({
        chatId: payload.chatId,
        senderId: payload.senderId,
        body: payload.body,
        replyToMessageId: payload.replyToMessageId,
        deliveredAt: new Date()
      })
      .returning();

    if (payload.attachments?.length) {
      await db.insert(attachments).values(
        payload.attachments.map((attachment) => ({
          messageId: message.id,
          uploaderId: payload.senderId,
          ...attachment
        }))
      );
    }

    await db
      .update(chats)
      .set({
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(chats.id, payload.chatId));

    return message;
  },

  getMessageById: async (messageId: string) => {
    const [message] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
    return message;
  },

  getAttachmentsForMessage: async (messageId: string) =>
    db.select().from(attachments).where(eq(attachments.messageId, messageId)),

  updateMessage: async (messageId: string, body: string) => {
    const [updated] = await db
      .update(messages)
      .set({ body, editedAt: new Date(), updatedAt: new Date() })
      .where(eq(messages.id, messageId))
      .returning();

    return updated;
  },

  softDeleteMessage: async (messageId: string) => {
    const [deleted] = await db
      .update(messages)
      .set({ body: null, deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(messages.id, messageId))
      .returning();

    return deleted;
  },

  addReaction: async (messageId: string, userId: string, emoji: string) => {
    await db.insert(reactions).values({ messageId, userId, emoji }).onConflictDoNothing();
    return db.select().from(reactions).where(and(eq(reactions.messageId, messageId), eq(reactions.userId, userId), eq(reactions.emoji, emoji))).limit(1);
  },

  removeReaction: async (messageId: string, userId: string, emoji: string) => {
    await db.delete(reactions).where(and(eq(reactions.messageId, messageId), eq(reactions.userId, userId), eq(reactions.emoji, emoji)));
  },

  markRead: async (messageId: string, userId: string) => {
    await db
      .insert(messageReads)
      .values({ messageId, userId })
      .onConflictDoUpdate({
        target: [messageReads.messageId, messageReads.userId],
        set: { readAt: new Date() }
      });
  },

  markAllRead: async (chatId: string, userId: string) => {
    // Get all message IDs in the chat that haven't been read by this user
    const unreadMessages = await db
      .select({ id: messages.id })
      .from(messages)
      .leftJoin(
        messageReads,
        and(eq(messageReads.messageId, messages.id), eq(messageReads.userId, userId))
      )
      .where(and(eq(messages.chatId, chatId), isNull(messageReads.messageId)));

    if (unreadMessages.length === 0) {
      return;
    }

    await db
      .insert(messageReads)
      .values(unreadMessages.map((m) => ({ messageId: m.id, userId })))
      .onConflictDoNothing();
  },

  isMember: async (chatId: string, userId: string) => {
    const [member] = await db
      .select({ chatId: chatMembers.chatId })
      .from(chatMembers)
      .where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId)))
      .limit(1);

    return Boolean(member);
  },

  searchUsers: async (query: string, currentUserId: string) =>
    db
      .select({
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        isOnline: users.isOnline
      })
      .from(users)
      .where(and(ilike(users.username, `%${query}%`), sql`${users.id} <> ${currentUserId}`))
      .limit(20),

  searchChats: async (query: string, userId: string) =>
    db
      .select({
        chatId: chats.id,
        type: chats.type,
        groupName: groups.name
      })
      .from(chatMembers)
      .innerJoin(chats, eq(chats.id, chatMembers.chatId))
      .leftJoin(groups, eq(groups.chatId, chats.id))
      .where(
        and(
          eq(chatMembers.userId, userId),
          or(ilike(groups.name, `%${query}%`), sql`${chats.id}::text ilike ${`%${query}%`}`)
        )
      )
      .limit(20),

  searchMessages: async (query: string, userId: string, chatId?: string) =>
    db
      .select({
        id: messages.id,
        chatId: messages.chatId,
        body: messages.body,
        createdAt: messages.createdAt,
        senderName: users.username
      })
      .from(messages)
      .innerJoin(chatMembers, eq(chatMembers.chatId, messages.chatId))
      .innerJoin(users, eq(users.id, messages.senderId))
      .where(
        and(
          eq(chatMembers.userId, userId),
          ilike(messages.body, `%${query}%`),
          chatId ? eq(messages.chatId, chatId) : undefined
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(30),

  getGroupById: async (groupId: string) => {
    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    return group;
  },

  getGroupMemberRole: async (groupId: string, userId: string) => {
    const [member] = await db
      .select({ role: groupMembers.role })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);
    return member?.role;
  },

  addGroupMember: async (groupId: string, userId: string) => {
    const group = await chatRepo.getGroupById(groupId);
    if (!group) {
      return null;
    }

    await db
      .insert(groupMembers)
      .values({ groupId, userId, role: "member" })
      .onConflictDoNothing();
    await db
      .insert(chatMembers)
      .values({ chatId: group.chatId, userId, role: "member" })
      .onConflictDoNothing();
    return group;
  },

  removeGroupMember: async (groupId: string, userId: string) => {
    const group = await chatRepo.getGroupById(groupId);
    if (!group) {
      return null;
    }
    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    await db
      .delete(chatMembers)
      .where(and(eq(chatMembers.chatId, group.chatId), eq(chatMembers.userId, userId)));
    return group;
  },

  updateGroupMemberRole: async (groupId: string, userId: string, role: "member" | "admin") => {
    const group = await chatRepo.getGroupById(groupId);
    if (!group) {
      return null;
    }

    await db
      .update(groupMembers)
      .set({ role })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    await db
      .update(chatMembers)
      .set({ role })
      .where(and(eq(chatMembers.chatId, group.chatId), eq(chatMembers.userId, userId)));

    return group;
  },

  listChatMemberIds: async (chatId: string) => {
    const rows = await db
      .select({ userId: chatMembers.userId })
      .from(chatMembers)
      .where(eq(chatMembers.chatId, chatId));
    return rows.map((row) => row.userId);
  },

  createNotifications: async (payload: {
    userIds: string[];
    actorId: string;
    type: string;
    data: Record<string, unknown>;
  }) => {
    if (payload.userIds.length === 0) {
      return;
    }
    await db.insert(notifications).values(
      payload.userIds.map((userId) => ({
        userId,
        actorId: payload.actorId,
        type: payload.type,
        payload: payload.data
      }))
    );
  },

  clearChat: async (chatId: string) => {
    await db.delete(messages).where(eq(messages.chatId, chatId));
    await db.update(chats).set({ lastMessageAt: new Date(), updatedAt: new Date() }).where(eq(chats.id, chatId));
  }
};
