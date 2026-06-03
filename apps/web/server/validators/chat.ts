import { z } from "zod";

export const createDirectChatSchema = z.object({
  memberUserId: z.string().uuid()
});

export const createGroupSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(600).optional(),
  avatarUrl: z.string().url().optional(),
  memberUserIds: z.array(z.string().uuid()).min(1).max(100)
});

export const messageInputSchema = z.object({
  body: z.string().max(5000).optional(),
  replyToMessageId: z.string().uuid().optional(),
  attachments: z
    .array(
      z.object({
        type: z.enum(["image", "file"]),
        url: z.string().url(),
        fileName: z.string().min(1).max(255),
        mimeType: z.string().min(1).max(120),
        sizeBytes: z.number().int().positive().max(100 * 1024 * 1024)
      })
    )
    .max(10)
    .optional()
});

export const messageEditSchema = z.object({
  body: z.string().min(1).max(5000)
});

export const reactionSchema = z.object({
  emoji: z.string().min(1).max(20)
});

export const readReceiptSchema = z.object({
  messageId: z.string().uuid()
});

export const searchSchema = z.object({
  q: z.string().min(1).max(120)
});

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(40).regex(/^[a-z0-9_\-\.\ \(\)]+$/i, "Username can only contain letters, numbers, spaces, and basic punctuation"),
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().url().optional()
});
