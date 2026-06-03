"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/hooks/use-search";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Search, Loader2 } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { data, isFetching } = useSearch(query);
  const router = useRouter();

  const createChat = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "direct", payload: { memberUserId: userId } })
      });
      if (!res.ok) throw new Error("Failed to create chat");
      return res.json();
    },
    onSuccess: (resData) => {
      router.push(`/chat/${resData.data.chatId}`);
    }
  });

  return (
    <div className="flex flex-col min-h-screen bg-[var(--clay-bg-app)]">
      <div className="mx-auto w-full max-w-5xl p-6 md:p-10 flex-1 flex flex-col gap-8">
        <div className="flex items-center gap-6">
          <Link href="/chat" className="rounded-full p-3 bg-[var(--clay-bg-panel)] shadow-clay-sm dark:shadow-clay-dark-sm hover:shadow-clay-md transition-shadow text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--clay-text-primary)]">Global Search</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input 
            autoFocus
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search users, chats, messages" 
            className="h-16 w-full rounded-[2.5rem] bg-[var(--clay-bg-panel)] pl-14 pr-6 border-none shadow-clay-inset dark:shadow-clay-dark-inset text-lg font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {isFetching ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--clay-primary)]" />
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Users Section */}
          <section className="bg-[var(--clay-bg-panel)] rounded-[2.5rem] p-6 shadow-clay-md dark:shadow-clay-dark-md flex flex-col gap-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-[var(--clay-text-secondary)] pl-2">Users</h2>
            <div className="space-y-4">
              {data?.users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => createChat.mutate(user.id)}
                  disabled={createChat.isPending}
                  className="w-full text-left bg-[var(--clay-bg-app)] shadow-clay-sm dark:shadow-clay-dark-sm hover:shadow-clay-md rounded-3xl p-4 font-bold text-[var(--clay-text-primary)] transition-all active:shadow-clay-inset disabled:opacity-50"
                >
                  {user.username}
                </button>
              ))}
              {(!data?.users || data.users.length === 0) && query && !isFetching && <p className="text-sm text-muted-foreground pl-2 font-medium">No users found.</p>}
            </div>
          </section>

          {/* Chats Section */}
          <section className="bg-[var(--clay-bg-panel)] rounded-[2.5rem] p-6 shadow-clay-md dark:shadow-clay-dark-md flex flex-col gap-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-[var(--clay-text-secondary)] pl-2">Groups</h2>
            <div className="space-y-4">
              {data?.chats.map((chat) => (
                <Link 
                  key={chat.chatId} 
                  href={`/chat/${chat.chatId}`} 
                  className="block bg-[var(--clay-bg-app)] shadow-clay-sm dark:shadow-clay-dark-sm hover:shadow-clay-md rounded-3xl p-4 font-bold text-[var(--clay-text-primary)] transition-all active:shadow-clay-inset"
                >
                  {chat.groupName ?? chat.chatId}
                </Link>
              ))}
              {(!data?.chats || data.chats.length === 0) && query && !isFetching && <p className="text-sm text-muted-foreground pl-2 font-medium">No groups found.</p>}
            </div>
          </section>

          {/* Messages Section */}
          <section className="bg-[var(--clay-bg-panel)] rounded-[2.5rem] p-6 shadow-clay-md dark:shadow-clay-dark-md flex flex-col gap-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-[var(--clay-text-secondary)] pl-2">Messages</h2>
            <div className="space-y-4">
              {data?.messages.map((message) => (
                <Link 
                  key={message.id} 
                  href={`/chat/${message.chatId}`} 
                  className="block bg-[var(--clay-bg-app)] shadow-clay-sm dark:shadow-clay-dark-sm hover:shadow-clay-md rounded-3xl p-4 transition-all active:shadow-clay-inset"
                >
                  <span className="font-bold text-[var(--clay-primary)] block text-sm mb-1">{message.senderName}</span>
                  <span className="text-sm font-medium text-[var(--clay-text-secondary)] block line-clamp-2 leading-snug">{message.body}</span>
                </Link>
              ))}
              {(!data?.messages || data.messages.length === 0) && query && !isFetching && <p className="text-sm text-muted-foreground pl-2 font-medium">No messages found.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
