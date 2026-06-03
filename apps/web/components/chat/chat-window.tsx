"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Virtuoso } from "react-virtuoso";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { SOCKET_EVENTS } from "@/lib/constants";
import { apiClient } from "@/services/api-client";
import { getExistingSocket } from "@/services/socket-client";
import { useChatStore } from "@/store/chat-store";
import { ChatMessage } from "@/types/chat";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useCurrentUser } from "@/hooks/use-current-user";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageComposer, PendingAttachment } from "@/components/chat/message-composer";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatInfoPanel, type ChatInfo } from "@/components/chat/chat-info-panel";
import { ChatSearchPanel } from "@/components/chat/chat-search-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MoreVertical, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const ChatWindow = ({ chatId }: { chatId: string }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { data: me } = useCurrentUser();
  const { isFetchingNextPage, fetchNextPage, hasNextPage } = useChatMessages(chatId);
  const queryClient = useQueryClient();

  const { data: chatInfo } = useQuery({
    queryKey: ["chat-info", chatId],
    queryFn: () => apiClient<ChatInfo>(`/api/chats/${chatId}/info`)
  });

  const chats = useChatStore((state) => state.chats);
  const activeChat = chats.find(c => c.id === chatId);

  const messages = useChatStore((state) => state.messagesByChat[chatId]) ?? [];
  const typingUsers = useChatStore((state) => state.typingByChat[chatId]) ?? [];
  const appendMessage = useChatStore((state) => state.appendMessage);
  const clearUnread = useChatStore((state) => state.clearUnread);

  const sendMessage = useMutation({
    mutationFn: (payload: { body?: string; attachments?: PendingAttachment[] }) =>
      apiClient<ChatMessage>(`/api/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify(payload)
      })
  });

  const clearChat = useMutation({
    mutationFn: () => apiClient(`/api/chats/${chatId}/clear`, { method: "POST" }),
    onSuccess: () => {
      useChatStore.getState().clearChatMessages(chatId);
      getExistingSocket()?.emit(SOCKET_EVENTS.CHAT_CLEARED, { chatId });
      toast.success("Chat cleared");
    },
    onError: () => toast.error("Failed to clear chat")
  });

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  // Socket room joining is now handled centrally by useSocket

  // Clear unread badge immediately when chat is opened
  useEffect(() => {
    clearUnread(chatId);
    // Also tell the server so it stays in sync on next load
    void apiClient(`/api/chats/${chatId}/read`, { method: "POST" })
      .then(() => queryClient.invalidateQueries({ queryKey: ["chats"] }))
      .catch(() => {/* best-effort */});

    getExistingSocket()?.emit(SOCKET_EVENTS.CHAT_READ_ALL, { chatId });
  }, [chatId, clearUnread, queryClient]);

  return (
    <div className="flex h-full w-full relative">
      <div className={`flex h-full min-h-0 flex-1 flex-col bg-[var(--clay-bg-app)] shadow-clay-inset dark:shadow-clay-dark-inset m-2 md:m-4 md:ml-2 rounded-3xl relative transition-all duration-300`}>
        {/* Header */}
        <div className="flex h-[72px] items-center justify-between bg-transparent px-6 z-10 shrink-0">
          <div className="flex items-center gap-4 cursor-pointer py-1" onClick={() => { setShowInfo(!showInfo); setShowSearch(false); }}>
          <Avatar className="h-10 w-10 bg-muted/50">
            <AvatarImage src={activeChat?.avatarUrl || undefined} alt={activeChat?.title} />
            <AvatarFallback>
              {(activeChat?.type === "group" || chatInfo?.type === "group") ? <Users className="h-5 w-5 text-muted-foreground" /> : (activeChat?.title ?? (chatInfo?.type === "group" ? chatInfo.group.name : chatInfo?.type === "direct" ? chatInfo.contact.username : "CH"))?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{activeChat?.title ?? "Chat"}</span>
            <span className={`text-xs font-medium ${typingUsers.length > 0 ? "text-[var(--clay-primary)]" : "text-muted-foreground truncate max-w-[400px]"}`}>
              {(() => {
                const typingUsernames = typingUsers.map(id => {
                  if (chatInfo?.type === "direct") return chatInfo.contact.id === id ? chatInfo.contact.username : "Someone";
                  if (chatInfo?.type === "group") return chatInfo.members.find(m => m.id === id)?.username ?? "Someone";
                  return "Someone";
                });

                if (typingUsernames.length > 0) {
                  if (chatInfo?.type === "direct") return "typing...";
                  return `${typingUsernames.length === 1 ? typingUsernames[0] + " is" : typingUsernames.join(", ") + " are"} typing...`;
                }

                if (!chatInfo) return null;
                if (chatInfo.type === "direct") {
                  if (chatInfo.contact.isOnline) return "online";
                  if (chatInfo.contact.lastSeenAt) return `last seen ${format(new Date(chatInfo.contact.lastSeenAt), "MMM d, h:mm a")}`;
                  return "offline";
                }
                
                return chatInfo.members.map(m => m.username).join(", ");
              })()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <button onClick={() => { setShowSearch(!showSearch); setShowInfo(false); }} className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5"><Search className="h-5 w-5" /></button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none"><MoreVertical className="h-5 w-5" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[var(--clay-bg-panel)] shadow-clay-card dark:shadow-clay-dark-card border-white/20 dark:border-white/5 rounded-2xl p-1">
              <DropdownMenuItem 
                onClick={() => clearChat.mutate()} 
                disabled={clearChat.isPending}
                className="text-red-500 focus:text-red-600 focus:bg-red-500/10 cursor-pointer rounded-xl"
              >
                Clear Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="min-h-0 flex-1 relative z-0">
        <Virtuoso
          className="h-full py-4 overflow-x-hidden"
          data={sortedMessages}
          initialTopMostItemIndex={Math.max(0, sortedMessages.length - 1)}
          alignToBottom
          startReached={() => {
            if (!isFetchingNextPage && hasNextPage) {
              void fetchNextPage();
            }
          }}
          itemContent={(_, message) => <MessageBubble message={message} own={message.senderId === me?.id} currentUserId={me?.id} />}
          followOutput="auto"
        />
      </div>

      <div className="shrink-0">
        <TypingIndicator 
          usernames={typingUsers.map(id => {
            if (chatInfo?.type === "direct") return chatInfo.contact.id === id ? chatInfo.contact.username : "Someone";
            if (chatInfo?.type === "group") return chatInfo.members.find(m => m.id === id)?.username ?? "Someone";
            return "Someone";
          })} 
        />
        <MessageComposer
          onSubmit={async (payload) => {
            const tempId = `temp:${crypto.randomUUID()}`;
            if (me) {
              appendMessage(chatId, {
                id: tempId,
                chatId,
                senderId: me.id,
                senderName: me.username,
                senderAvatar: me.avatarUrl,
                body: payload.body ?? null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                attachments:
                  payload.attachments?.map((attachment) => ({
                    id: `temp-attachment:${crypto.randomUUID()}`,
                    ...attachment
                  })) ?? [],
                reactions: [],
                readBy: [me.id],
                replyToMessageId: null,
                editedAt: null,
                deletedAt: null
              });
            }
            try {
              const sent = await sendMessage.mutateAsync(payload);
              useChatStore.getState().updateMessage(chatId, tempId, () => sent);
              getExistingSocket()?.emit(SOCKET_EVENTS.CHAT_MESSAGE_SEND, sent);
            } catch (err) {
              // Revert optimistic update on error
              useChatStore.setState((state) => ({
                messagesByChat: {
                  ...state.messagesByChat,
                  [chatId]: (state.messagesByChat[chatId] ?? []).filter((m) => m.id !== tempId)
                }
              }));
              toast.error("Failed to send message");
            }
          }}
          onTyping={(typing) => {
            getExistingSocket()?.emit(typing ? SOCKET_EVENTS.CHAT_TYPING_START : SOCKET_EVENTS.CHAT_TYPING_STOP, {
              chatId
            });
          }}
        />
      </div>
      </div>
      {showInfo && <ChatInfoPanel chatId={chatId} onClose={() => setShowInfo(false)} />}
      {showSearch && <ChatSearchPanel chatId={chatId} onClose={() => setShowSearch(false)} />}
    </div>
  );
};
