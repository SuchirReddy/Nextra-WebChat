import { ApiError } from "@/lib/errors";
import { sanitizeText } from "@/lib/sanitize";
import { chatRepo } from "@/server/repos/chat-repo";

export const chatService = {
  listChats: async (userId: string) => chatRepo.listChatsForUser(userId),

  getChatInfo: async (chatId: string, userId: string) => {
    const isMember = await chatRepo.isMember(chatId, userId);
    if (!isMember) {
      throw new ApiError("Not a member of this chat", 403);
    }
    const info = await chatRepo.getChatInfo(chatId, userId);
    if (!info) {
      throw new ApiError("Chat not found", 404);
    }
    return info;
  },

  createDirectChat: async (userId: string, peerUserId: string) => {
    if (userId === peerUserId) {
      throw new ApiError("Cannot chat with yourself", 400);
    }

    return chatRepo.createDirectChat(userId, peerUserId);
  },

  createGroup: async (payload: {
    creatorId: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    memberUserIds: string[];
  }) => {
    const group = await chatRepo.createGroupChat({
      ...payload,
      name: sanitizeText(payload.name),
      description: payload.description ? sanitizeText(payload.description) : undefined
    });

    return group;
  },

  listMessages: async (chatId: string, userId: string, limit: number, before?: string) => {
    const isMember = await chatRepo.isMember(chatId, userId);
    if (!isMember) {
      throw new ApiError("Forbidden", 403);
    }

    return chatRepo.listMessages(chatId, limit, before);
  },

  sendMessage: async (
    userId: string,
    payload: {
      chatId: string;
      body?: string;
      replyToMessageId?: string;
      attachments?: Array<{
        type: "image" | "file";
        url: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
      }>;
    }
  ) => {
    const isMember = await chatRepo.isMember(payload.chatId, userId);
    if (!isMember) {
      throw new ApiError("Forbidden", 403);
    }

    const body = payload.body ? sanitizeText(payload.body) : undefined;
    if (!body && (!payload.attachments || payload.attachments.length === 0)) {
      throw new ApiError("Message body or attachments are required", 400);
    }

    const created = await chatRepo.insertMessage({
      ...payload,
      body,
      senderId: userId
    });

    const memberIds = await chatRepo.listChatMemberIds(payload.chatId);
    const recipients = memberIds.filter((id) => id !== userId);
    await chatRepo.createNotifications({
      userIds: recipients,
      actorId: userId,
      type: "message:new",
      data: { chatId: payload.chatId, messageId: created.id, preview: body?.slice(0, 100) ?? null }
    });

    const [full] = await chatRepo.listMessages(payload.chatId, 1);
    return full ?? created;
  },

  editMessage: async (userId: string, messageId: string, body: string) => {
    const message = await chatRepo.getMessageById(messageId);
    if (!message) {
      throw new ApiError("Message not found", 404);
    }
    if (message.senderId !== userId) {
      throw new ApiError("Forbidden", 403);
    }

    return chatRepo.updateMessage(messageId, sanitizeText(body));
  },

  deleteMessage: async (userId: string, messageId: string) => {
    const message = await chatRepo.getMessageById(messageId);
    if (!message) {
      throw new ApiError("Message not found", 404);
    }
    if (message.senderId !== userId) {
      throw new ApiError("Forbidden", 403);
    }

    return chatRepo.softDeleteMessage(messageId);
  },

  addReaction: async (userId: string, messageId: string, emoji: string) => {
    const message = await chatRepo.getMessageById(messageId);
    if (!message) {
      throw new ApiError("Message not found", 404);
    }

    const member = await chatRepo.isMember(message.chatId, userId);
    if (!member) {
      throw new ApiError("Forbidden", 403);
    }

    return chatRepo.addReaction(messageId, userId, emoji);
  },

  removeReaction: async (userId: string, messageId: string, emoji: string) => {
    const message = await chatRepo.getMessageById(messageId);
    if (!message) {
      throw new ApiError("Message not found", 404);
    }

    const member = await chatRepo.isMember(message.chatId, userId);
    if (!member) {
      throw new ApiError("Forbidden", 403);
    }

    await chatRepo.removeReaction(messageId, userId, emoji);
  },

  forwardMessage: async (userId: string, sourceMessageId: string, targetChatId: string) => {
    const source = await chatRepo.getMessageById(sourceMessageId);
    if (!source) {
      throw new ApiError("Source message not found", 404);
    }

    const sourceMember = await chatRepo.isMember(source.chatId, userId);
    const targetMember = await chatRepo.isMember(targetChatId, userId);
    if (!sourceMember || !targetMember) {
      throw new ApiError("Forbidden", 403);
    }

    const sourceAttachments = await chatRepo.getAttachmentsForMessage(sourceMessageId);
    const created = await chatRepo.insertMessage({
      chatId: targetChatId,
      senderId: userId,
      body: source.body ? `Forwarded: ${source.body}` : undefined,
      attachments: sourceAttachments.map((attachment) => ({
        type: attachment.type,
        url: attachment.url,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes
      }))
    });

    const [full] = await chatRepo.listMessages(targetChatId, 1);
    return full ?? created;
  },

  markRead: async (userId: string, chatId: string, messageId: string) => {
    const member = await chatRepo.isMember(chatId, userId);
    if (!member) {
      throw new ApiError("Forbidden", 403);
    }

    await chatRepo.markRead(messageId, userId);
  },

  markAllRead: async (userId: string, chatId: string) => {
    const member = await chatRepo.isMember(chatId, userId);
    if (!member) {
      throw new ApiError("Forbidden", 403);
    }

    await chatRepo.markAllRead(chatId, userId);
  }
};
