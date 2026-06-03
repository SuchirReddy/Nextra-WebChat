"use client";

import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { SOCKET_EVENTS } from "@/lib/constants";
import { apiClient } from "@/services/api-client";
import { disconnectSocketClient, getSocketClient, getExistingSocket } from "@/services/socket-client";
import { useChatStore } from "@/store/chat-store";
import { ChatMessage, PresenceUser } from "@/types/chat";

export const useSocket = () => {
  const { isSignedIn } = useAuth();
  const initialized = useRef(false);
  const activeChatRef = useRef<string | undefined>(undefined);
  const queryClient = useQueryClient();

  const appendMessage = useChatStore((state) => state.appendMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const setTypingUsers = useChatStore((state) => state.setTypingUsers);
  const setPresence = useChatStore((state) => state.setPresence);
  const upsertChat = useChatStore((state) => state.upsertChat);
  const activeChatId = useChatStore((state) => state.activeChatId);

  useEffect(() => {
    const socket = getExistingSocket();
    if (socket && socket.connected) {
      if (activeChatRef.current) {
        socket.emit(SOCKET_EVENTS.CHAT_LEAVE, { chatId: activeChatRef.current });
      }
      if (activeChatId) {
        socket.emit(SOCKET_EVENTS.CHAT_JOIN, { chatId: activeChatId });
      }
    }
    activeChatRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!isSignedIn || initialized.current) {
      return;
    }

    let mounted = true;

    const setup = async () => {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        void Notification.requestPermission();
      }

      const { token } = await apiClient<{ token: string }>("/api/socket-token", { method: "POST" });
      if (!mounted) {
        return;
      }

      const socket = getSocketClient(token);
      initialized.current = true;

      socket.on("connect", () => {
        if (activeChatRef.current) {
          socket.emit(SOCKET_EVENTS.CHAT_JOIN, { chatId: activeChatRef.current });
        }
      });

      socket.on("connect_error", (error) => {
        // Ignore generic disconnection errors that happen during server restarts
        if (error.message !== "websocket error" && error.message !== "xhr poll error") {
          toast.error(`Socket error: ${error.message}`);
        }
      });

      socket.on(SOCKET_EVENTS.CHAT_MESSAGE_NEW, (message: ChatMessage) => {
        appendMessage(message.chatId, message);

        // Only increment unread if the user isn't currently viewing this chat
        const currentActiveChat = activeChatRef.current;
        const isActiveChat = currentActiveChat === message.chatId;

        upsertChat({
          id: message.chatId,
          type: "direct",
          title: message.senderName,
          unreadCount: isActiveChat ? 0 : 1, // will be added to existing by upsertChat
          lastMessage: message.body ?? "Attachment",
          lastMessageAt: message.createdAt
        }, !isActiveChat); // pass flag to increment instead of set

        if (isActiveChat) {
          if (typeof document !== "undefined" && !document.hidden) {
            socket.emit(SOCKET_EVENTS.CHAT_READ_RECEIPT, {
              chatId: message.chatId,
              messageId: message.id
            });
          }
        } else if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification(`New message from ${message.senderName}`, {
            body: message.body ?? "Sent an attachment"
          });
        }
      });

      socket.on(SOCKET_EVENTS.CHAT_MESSAGE_EDIT, (payload: { chatId: string; messageId: string; body: string; editedAt: string }) => {
        updateMessage(payload.chatId, payload.messageId, (msg) => ({
          ...msg,
          body: payload.body,
          editedAt: payload.editedAt
        }));
      });

      socket.on(SOCKET_EVENTS.CHAT_MESSAGE_DELETE, ({ chatId, messageId }: { chatId: string; messageId: string }) => {
        updateMessage(chatId, messageId, (msg) => ({
          ...msg,
          body: null,
          deletedAt: new Date().toISOString()
        }));
      });

      socket.on(SOCKET_EVENTS.CHAT_MESSAGE_REACTION, (payload: { chatId: string; messageId: string; emoji: string; userId: string; action: "add" | "remove" }) => {
        updateMessage(payload.chatId, payload.messageId, (msg) => {
          let newReactions = [...msg.reactions];
          if (payload.action === "add") {
            if (!newReactions.some(r => r.emoji === payload.emoji && r.userId === payload.userId)) {
              newReactions.push({ id: crypto.randomUUID(), emoji: payload.emoji, userId: payload.userId });
            }
          } else {
            newReactions = newReactions.filter(r => !(r.emoji === payload.emoji && r.userId === payload.userId));
          }
          return { ...msg, reactions: newReactions };
        });
      });

      socket.on(SOCKET_EVENTS.CHAT_TYPING_STATE, ({ chatId, userIds }: { chatId: string; userIds: string[] }) => {
        setTypingUsers(chatId, userIds);
      });

      socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, (presence: PresenceUser) => {
        setPresence(presence);
      });

      socket.on(SOCKET_EVENTS.CHAT_READ_UPDATE, (payload: { chatId: string; messageId: string; userId: string; readAt: string }) => {
        updateMessage(payload.chatId, payload.messageId, (msg) => {
          if (!msg.readBy.includes(payload.userId)) {
            return { ...msg, readBy: [...msg.readBy, payload.userId] };
          }
          return msg;
        });
      });

      socket.on(SOCKET_EVENTS.CHAT_READ_ALL_UPDATE, (payload: { chatId: string; userId: string; readAt: string }) => {
        const currentMessages = useChatStore.getState().messagesByChat[payload.chatId] ?? [];
        const updatedMessages = currentMessages.map((msg) => {
          if (!msg.readBy.includes(payload.userId)) {
            return { ...msg, readBy: [...msg.readBy, payload.userId] };
          }
          return msg;
        });
        useChatStore.getState().setMessages(payload.chatId, updatedMessages);
      });

      socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, () => {
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      });

      socket.on(SOCKET_EVENTS.GROUP_INFO_UPDATE, (payload: { chatId: string }) => {
        void queryClient.invalidateQueries({ queryKey: ["chat-info", payload.chatId] });
      });

      socket.on(SOCKET_EVENTS.CHAT_CLEARED, (payload: { chatId: string }) => {
        useChatStore.getState().clearChatMessages(payload.chatId);
      });
    };

    void setup();

    return () => {
      mounted = false;
      disconnectSocketClient();
      initialized.current = false;
    };
  }, [appendMessage, updateMessage, isSignedIn, setPresence, setTypingUsers, upsertChat, queryClient]);
};
