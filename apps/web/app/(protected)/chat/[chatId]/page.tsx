"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChatListPanel } from "@/components/chat/chat-list-panel";
import { ChatWindow } from "@/components/chat/chat-window";
import { useSocket } from "@/hooks/use-socket";
import { useChatStore } from "@/store/chat-store";

function ChatPageContent() {
  const params = useParams<{ chatId: string }>();
  const activeChatId = useChatStore((state) => state.activeChatId);
  const setActiveChat = useChatStore((state) => state.setActiveChat);

  useSocket();

  useEffect(() => {
    if (params.chatId) {
      setActiveChat(params.chatId);
    }
  }, [params.chatId, setActiveChat]);

  if (!activeChatId) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading chat...</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <div className="h-56 w-full md:hidden">
        <ChatListPanel activeChatId={activeChatId} />
      </div>
      <div className="hidden md:block">
        <ChatListPanel activeChatId={activeChatId} />
      </div>
      <div className="min-w-0 flex-1">
        <ChatWindow chatId={activeChatId} />
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading chat...</div>;
  }

  return <ChatPageContent />;
}
