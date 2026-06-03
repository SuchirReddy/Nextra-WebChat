"use client";

import { create } from "zustand";
import { ChatListItem, ChatMessage, PresenceUser } from "@/types/chat";

type ChatStore = {
  chats: ChatListItem[];
  messagesByChat: Record<string, ChatMessage[]>;
  activeChatId?: string;
  typingByChat: Record<string, string[]>;
  presence: Record<string, PresenceUser>;
  setChats: (chats: ChatListItem[]) => void;
  upsertChat: (chat: ChatListItem, incrementUnread?: boolean) => void;
  setActiveChat: (chatId: string) => void;
  setMessages: (chatId: string, messages: ChatMessage[]) => void;
  appendMessage: (chatId: string, message: ChatMessage) => void;
  updateMessage: (chatId: string, messageId: string, updater: (message: ChatMessage) => ChatMessage) => void;
  clearUnread: (chatId: string) => void;
  setTypingUsers: (chatId: string, userIds: string[]) => void;
  setPresence: (entry: PresenceUser) => void;
  clearChatMessages: (chatId: string) => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  messagesByChat: {},
  typingByChat: {},
  presence: {},
  setChats: (chats) => set({ chats }),
  upsertChat: (chat, incrementUnread = false) => {
    const current = get().chats;
    const idx = current.findIndex((item) => item.id === chat.id);
    if (idx === -1) {
      set({ chats: [chat, ...current] });
      return;
    }

    const next = [...current];
    const existing = next[idx]!;
    next[idx] = {
      ...existing,
      ...chat,
      // When incrementUnread=true, add to existing count; otherwise use the new value
      unreadCount: incrementUnread
        ? (existing.unreadCount ?? 0) + (chat.unreadCount ?? 1)
        : chat.unreadCount
    };
    set({ chats: next.sort((a, b) => (a.lastMessageAt ?? "") < (b.lastMessageAt ?? "") ? 1 : -1) });
  },
  setActiveChat: (chatId) => set({ activeChatId: chatId }),
  setMessages: (chatId, messages) =>
    set((state) => ({
      messagesByChat: {
        ...state.messagesByChat,
        [chatId]: messages
      }
    })),
  appendMessage: (chatId, message) =>
    set((state) => {
      const existing = state.messagesByChat[chatId] ?? [];
      if (existing.some((m) => m.id === message.id)) {
        return state;
      }

      return {
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: [message, ...existing]
        }
      };
    }),
  updateMessage: (chatId, messageId, updater) =>
    set((state) => ({
      messagesByChat: {
        ...state.messagesByChat,
        [chatId]: (state.messagesByChat[chatId] ?? []).map((message) =>
          message.id === messageId ? updater(message) : message
        )
      }
    })),
  clearUnread: (chatId) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    })),
  setTypingUsers: (chatId, userIds) =>
    set((state) => ({
      typingByChat: {
        ...state.typingByChat,
        [chatId]: userIds
      }
    })),
  setPresence: (entry) =>
    set((state) => ({
      presence: {
        ...state.presence,
        [entry.userId]: entry
      }
    })),
  clearChatMessages: (chatId) =>
    set((state) => ({
      messagesByChat: {
        ...state.messagesByChat,
        [chatId]: []
      },
      chats: state.chats.map((chat) => 
        chat.id === chatId ? { ...chat, lastMessage: null } : chat
      )
    }))
}));
