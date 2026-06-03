"use client";

import Link from "next/link";
import { MessageCircleMore, Users, CircleDashed, MessageSquarePlus, MoreVertical, Search, Filter, Sun, Moon } from "lucide-react";
import { useChats } from "@/hooks/use-chats";
import { useChatStore } from "@/store/chat-store";
import { toast } from "sonner";
import { UserMenu } from "@/components/layout/user-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export const ChatListPanel = ({ activeChatId }: { activeChatId?: string }) => {
  const { isLoading } = useChats();
  const chats = useChatStore((state) => state.chats);
  const { theme, setTheme } = useTheme();

  return (
    <aside className="flex h-full w-full flex-col bg-[var(--clay-bg-panel)] md:w-[400px] shadow-clay-md dark:shadow-clay-dark-md md:rounded-[2rem] z-20 overflow-hidden">
      {/* Header */}
      <div className="flex h-16 items-center justify-between bg-[var(--clay-bg-header)] px-4 shrink-0 border-b border-border/40 z-10">
        <UserMenu />
        <div className="flex items-center gap-3 text-muted-foreground">
          <button className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5" onClick={() => toast.info("Communities coming soon")}>
            <Users className="h-5 w-5" />
          </button>
          <button onClick={() => toast.info("Status coming soon")} className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5" title="Status"><CircleDashed className="h-5 w-5" /></button>
          <Link href="/search" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5" title="New Chat"><MessageSquarePlus className="h-5 w-5" /></Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5 outline-none"><MoreVertical className="h-5 w-5" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-[var(--clay-bg-app)] shadow-lg rounded-2xl border border-white/40 dark:border-white/5 p-2">
              <DropdownMenuItem asChild className="cursor-pointer w-full rounded-xl py-3 px-4 text-[14px] font-medium transition-colors hover:bg-[var(--clay-bg-panel)] focus:bg-[var(--clay-bg-panel)] mb-1">
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer w-full rounded-xl py-3 px-4 text-[14px] font-medium transition-colors hover:bg-[var(--clay-bg-panel)] focus:bg-[var(--clay-bg-panel)] mb-1" onClick={() => toast.info("Settings coming soon")}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer w-full rounded-xl py-3 px-4 text-[14px] font-medium transition-colors hover:bg-[var(--clay-bg-panel)] focus:bg-[var(--clay-bg-panel)]" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <><Sun className="mr-2.5 h-[18px] w-[18px]" /> Light Mode</> : <><Moon className="mr-2.5 h-[18px] w-[18px]" /> Dark Mode</>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-[var(--clay-bg-panel)] px-4 py-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search or start a new chat" 
            className="h-10 w-full rounded-2xl bg-[var(--clay-bg-app)] pl-10 border-none shadow-clay-inset dark:shadow-clay-dark-inset focus-visible:ring-0 focus-visible:ring-offset-0" 
          />
        </div>
        <button onClick={() => toast.info("Filters coming soon")} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><Filter className="h-5 w-5" /></button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {isLoading
            ? Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-3 px-3 py-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            : chats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-2xl transition-all duration-300 group",
                    activeChatId === chat.id 
                      ? "bg-[var(--clay-bg-chat-active)] shadow-clay-inset dark:shadow-clay-dark-inset border border-transparent" 
                      : "bg-background shadow-sm border border-white/60 dark:border-white/10 hover:shadow-clay-sm dark:hover:shadow-clay-dark-sm hover:-translate-y-0.5"
                  )}
                >
                  <Avatar className="h-12 w-12 bg-muted/50">
                    <AvatarImage src={chat.avatarUrl || undefined} alt={chat.title} />
                    <AvatarFallback>
                      {chat.type === "group" ? <Users className="h-5 w-5 text-muted-foreground" /> : chat.title.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col pb-1 pt-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className="truncate text-base text-foreground">{chat.title}</p>
                      <p className={cn("text-xs flex-shrink-0", chat.unreadCount > 0 ? "text-[var(--clay-primary)] font-medium" : "text-muted-foreground")}>
                        {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="truncate text-sm text-muted-foreground">{chat.lastMessage ?? "No messages yet"}</p>
                      {chat.unreadCount > 0 ? (
                        <Badge className="h-6 min-w-6 rounded-full px-1.5 flex items-center justify-center bg-[var(--clay-primary)] text-white hover:bg-[var(--clay-primary)] shadow-clay-sm border-none">
                          {chat.unreadCount}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}

          {!isLoading && chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageCircleMore className="mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs text-muted-foreground">Start a direct chat or create a group.</p>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </aside>
  );
};
