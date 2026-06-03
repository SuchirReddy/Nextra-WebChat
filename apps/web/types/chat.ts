export type ChatListItem = {
  id: string;
  type: "direct" | "group";
  title: string;
  avatarUrl?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
};

export type MessageAttachment = {
  id: string;
  type: "image" | "file";
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type MessageReaction = {
  id: string;
  emoji: string;
  userId: string;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  body?: string | null;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  replyToMessageId?: string | null;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  readBy: string[];
};

export type PresenceUser = {
  userId: string;
  isOnline: boolean;
  lastSeenAt?: string | null;
};
