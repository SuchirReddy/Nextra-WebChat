"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChats } from "@/hooks/use-chats";
import { ChatListPanel } from "@/components/chat/chat-list-panel";
import { Lock } from "lucide-react";

export default function ChatIndexPage() {
  const router = useRouter();
  const { data } = useChats();

  useEffect(() => {
    if (data && data.length > 0) {
      router.replace(`/chat/${data[0].id}`);
    }
  }, [data, router]);

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <div className="h-56 w-full md:hidden">
        <ChatListPanel />
      </div>
      <div className="hidden md:block">
        <ChatListPanel />
      </div>
      <div className="hidden flex-1 flex-col items-center justify-center bg-[var(--wa-bg-chat)] border-b-[6px] border-[var(--wa-green)] md:flex">
        <div className="max-w-md text-center space-y-6">
          <h2 className="text-3xl font-light text-foreground">Nextra Chat</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Realtime messaging with your network. <br/>
            Send and receive messages seamlessly across devices.
          </p>
        </div>
        <div className="absolute bottom-10 flex items-center gap-1.5 text-xs text-muted-foreground/70">
          <Lock className="h-3 w-3" />
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}
