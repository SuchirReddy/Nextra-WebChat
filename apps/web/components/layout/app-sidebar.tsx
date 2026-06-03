"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, LayoutDashboard, MessageSquare, Search, Settings, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { useChatStore } from "@/store/chat-store";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chats", icon: MessageSquare },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/search", label: "Search", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield }
];

export const AppSidebar = () => {
  const pathname = usePathname();
  const { data, markAsRead } = useNotifications();
  const notificationCount = data?.unreadCount ?? 0;
  const chats = useChatStore((state) => state.chats);
  const totalUnread = chats.reduce((acc, chat) => acc + (chat.unreadCount ?? 0), 0);

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-background/80 p-3 backdrop-blur md:w-72">
      <div className="mb-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 p-[1px]">
        <div className="rounded-[11px] bg-card p-4">
          <h1 className="text-lg font-bold tracking-tight">Nextra</h1>
          <p className="text-xs text-muted-foreground">Realtime collaboration platform</p>
        </div>
      </div>

      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/70"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.href === "/chat" && totalUnread > 0 ? <Badge className="ml-auto">{totalUnread}</Badge> : null}
              <AnimatePresence>
                {active ? (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
                  />
                ) : null}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div 
        className={cn(
          "mt-auto rounded-xl border border-border bg-card p-3 transition-colors",
          notificationCount > 0 && "cursor-pointer hover:bg-accent/50"
        )}
        onClick={() => {
          if (notificationCount > 0) {
            markAsRead.mutate();
          }
        }}
      >
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <div className="relative flex h-5 w-5 items-center justify-center">
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
              </span>
            )}
          </div>
          Notifications
        </div>
        <p className="text-xs text-muted-foreground">Live unread badges and browser alerts are enabled.</p>
      </div>
    </aside>
  );
};
