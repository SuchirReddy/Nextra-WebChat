import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "banned"]);
export const chatTypeEnum = pgEnum("chat_type", ["direct", "group"]);
export const memberRoleEnum = pgEnum("member_role", ["member", "admin"]);
export const friendshipStatusEnum = pgEnum("friendship_status", ["pending", "accepted", "declined"]);
export const attachmentTypeEnum = pgEnum("attachment_type", ["image", "file"]);
export const reportStatusEnum = pgEnum("report_status", ["open", "in_review", "resolved", "dismissed"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 320 }).notNull(),
    username: varchar("username", { length: 40 }).notNull().unique(),
    avatarUrl: text("avatar_url"),
    bio: varchar("bio", { length: 280 }),
    role: userRoleEnum("role").notNull().default("user"),
    isOnline: boolean("is_online").notNull().default(false),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    onlineIdx: index("users_online_idx").on(table.isOnline),
    roleIdx: index("users_role_idx").on(table.role),
    usernameSearchIdx: index("users_username_search_idx").on(sql`lower(${table.username})`)
  })
);

export const chats = pgTable(
  "chats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: chatTypeEnum("type").notNull(),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    typeIdx: index("chats_type_idx").on(table.type),
    lastMessageIdx: index("chats_last_message_idx").on(table.lastMessageAt)
  })
);

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: uuid("chat_id")
      .notNull()
      .unique()
      .references(() => chats.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    description: varchar("description", { length: 600 }),
    avatarUrl: text("avatar_url"),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    groupNameIdx: index("groups_name_idx").on(sql`lower(${table.name})`)
  })
);

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.userId], name: "group_members_pk" }),
    roleIdx: index("group_members_role_idx").on(table.role),
    userIdx: index("group_members_user_idx").on(table.userId)
  })
);

export const chatMembers = pgTable(
  "chat_members",
  {
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("member"),
    lastReadMessageId: uuid("last_read_message_id"),
    muted: boolean("muted").notNull().default(false),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.userId], name: "chat_members_pk" }),
    userIdx: index("chat_members_user_idx").on(table.userId),
    roleIdx: index("chat_members_role_idx").on(table.role)
  })
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body"),
    replyToMessageId: uuid("reply_to_message_id"),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    chatCreatedIdx: index("messages_chat_created_idx").on(table.chatId, table.createdAt),
    senderIdx: index("messages_sender_idx").on(table.senderId),
    replyIdx: index("messages_reply_idx").on(table.replyToMessageId),
    searchBodyIdx: index("messages_body_search_idx").on(sql`to_tsvector('english', coalesce(${table.body}, ''))`)
  })
);

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    uploaderId: uuid("uploader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: attachmentTypeEnum("type").notNull(),
    url: text("url").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    messageIdx: index("attachments_message_idx").on(table.messageId),
    typeIdx: index("attachments_type_idx").on(table.type)
  })
);

export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: varchar("emoji", { length: 20 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    uniq: uniqueIndex("reactions_message_user_emoji_uniq").on(table.messageId, table.userId, table.emoji),
    messageIdx: index("reactions_message_idx").on(table.messageId)
  })
);

export const messageReads = pgTable(
  "message_reads",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.messageId, table.userId], name: "message_reads_pk" }),
    userIdx: index("message_reads_user_idx").on(table.userId)
  })
);

export const typingStatus = pgTable(
  "typing_status",
  {
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isTyping: boolean("is_typing").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.userId], name: "typing_status_pk" }),
    updatedIdx: index("typing_status_updated_idx").on(table.updatedAt)
  })
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    type: varchar("type", { length: 60 }).notNull(),
    payload: jsonb("payload").notNull().default({}),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userCreatedIdx: index("notifications_user_created_idx").on(table.userId, table.createdAt),
    unreadIdx: index("notifications_unread_idx").on(table.userId, table.readAt)
  })
);

export const friendships = pgTable(
  "friendships",
  {
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: uuid("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: friendshipStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.requesterId, table.addresseeId], name: "friendships_pk" }),
    addresseeIdx: index("friendships_addressee_idx").on(table.addresseeId),
    statusIdx: index("friendships_status_idx").on(table.status)
  })
);

export const blockedUsers = pgTable(
  "blocked_users",
  {
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.blockerId, table.blockedId], name: "blocked_users_pk" }),
    blockedIdx: index("blocked_users_blocked_idx").on(table.blockedId)
  })
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetMessageId: uuid("target_message_id").references(() => messages.id, { onDelete: "set null" }),
    targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "set null" }),
    reason: varchar("reason", { length: 240 }).notNull(),
    status: reportStatusEnum("status").notNull().default("open"),
    resolvedById: uuid("resolved_by_id").references(() => users.id, { onDelete: "set null" }),
    resolutionNotes: text("resolution_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    statusIdx: index("reports_status_idx").on(table.status),
    createdIdx: index("reports_created_idx").on(table.createdAt)
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  chatMemberships: many(chatMembers),
  groupMemberships: many(groupMembers),
  messages: many(messages),
  notifications: many(notifications)
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  creator: one(users, {
    fields: [chats.createdById],
    references: [users.id]
  }),
  members: many(chatMembers),
  messages: many(messages),
  group: one(groups, {
    fields: [chats.id],
    references: [groups.chatId]
  })
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  chat: one(chats, {
    fields: [groups.chatId],
    references: [chats.id]
  }),
  members: many(groupMembers)
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id]
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id]
  }),
  attachments: many(attachments),
  reactions: many(reactions),
  reads: many(messageReads)
}));

export type DbUser = typeof users.$inferSelect;
export type DbChat = typeof chats.$inferSelect;
export type DbMessage = typeof messages.$inferSelect;
export type DbGroup = typeof groups.$inferSelect;
