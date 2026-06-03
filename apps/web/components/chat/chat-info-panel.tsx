"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, MoreVertical, Users } from "lucide-react";
import { format } from "date-fns";
import { SOCKET_EVENTS } from "@/lib/constants";
import { apiClient } from "@/services/api-client";
import { getExistingSocket } from "@/services/socket-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ChatInfo = 
  | { type: "direct"; contact: { id: string; username: string; avatarUrl: string | null; bio: string | null; isOnline: boolean; lastSeenAt: string | null; createdAt: string } }
  | { type: "group"; group: { id: string; name: string; description: string | null; avatarUrl: string | null; createdAt: string }; members: Array<{ id: string; username: string; avatarUrl: string | null; role: "admin" | "member"; isOnline: boolean; lastSeenAt: string | null }> };

export const ChatInfoPanel = ({ chatId, onClose }: { chatId: string; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["chat-info", chatId],
    queryFn: () => apiClient<ChatInfo>(`/api/chats/${chatId}/info`)
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => {
      if (data?.type !== "group") throw new Error("Not a group");
      return apiClient(`/api/groups/${data.group.id}/members`, {
        method: "DELETE",
        body: JSON.stringify({ userId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-info", chatId] });
      getExistingSocket()?.emit(SOCKET_EVENTS.GROUP_INFO_UPDATE, { chatId });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "member" | "admin" }) => {
      if (data?.type !== "group") throw new Error("Not a group");
      return apiClient(`/api/groups/${data.group.id}/members`, {
        method: "PATCH",
        body: JSON.stringify({ userId, role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-info", chatId] });
      getExistingSocket()?.emit(SOCKET_EVENTS.GROUP_INFO_UPDATE, { chatId });
    }
  });

  const isCurrentUserAdmin = data?.type === "group" && data.members.find(m => m.id === currentUser?.id)?.role === "admin";

  return (
    <div className="flex h-[calc(100%-16px)] w-[350px] flex-col bg-[var(--clay-bg-panel)] shadow-lg border border-white/40 dark:border-white/5 rounded-3xl m-2 ml-0 shrink-0 z-20 overflow-hidden">
      <div className="flex h-[72px] items-center gap-4 bg-[var(--clay-bg-header)] px-4 border-b border-border/40 z-10 shrink-0">
        <button onClick={onClose} className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5 outline-none">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
        <span className="font-medium">Contact Info</span>
      </div>

      <ScrollArea className="flex-1 bg-[var(--clay-bg-app)]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Skeleton className="h-40 w-40 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-destructive">Failed to load info</div>
        ) : !data ? null : data.type === "direct" ? (
          <div className="flex flex-col items-center p-6 space-y-4 bg-transparent pb-8">
            <Avatar className="h-48 w-48 border-[3px] border-background shadow-sm">
              <AvatarImage src={data.contact.avatarUrl || undefined} />
              <AvatarFallback className="text-6xl font-light">{data.contact.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-2xl font-medium">{data.contact.username}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {data.contact.isOnline ? "Online" : data.contact.lastSeenAt ? `Last seen ${format(new Date(data.contact.lastSeenAt), "MMM d, h:mm a")}` : "Offline"}
              </p>
            </div>
            
            <div className="w-full bg-background rounded-2xl p-4 mt-6 shadow-sm border border-white/40 dark:border-white/5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</p>
              <p className="text-sm">{data.contact.bio || "Hey there! I am using Realtime Workspace."}</p>
              <p className="text-xs text-muted-foreground mt-4">Joined {format(new Date(data.contact.createdAt), "MMMM yyyy")}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex flex-col items-center p-6 space-y-4 bg-transparent pb-8">
              <Avatar className="h-48 w-48 border-[3px] border-background shadow-sm bg-muted/30">
                <AvatarImage src={data.group.avatarUrl || undefined} />
                <AvatarFallback className="text-6xl font-light text-muted-foreground/50">
                  <Users className="h-24 w-24" />
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-2xl font-medium">{data.group.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">Group · {data.members.length} participants</p>
              </div>
              
              {data.group.description && (
                <div className="w-full text-center mt-2">
                  <p className="text-sm">{data.group.description}</p>
                </div>
              )}
            </div>

            <div className="p-4 mt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                {data.members.length} Participants
              </p>
              <div className="bg-background rounded-2xl shadow-sm border border-white/40 dark:border-white/5 overflow-hidden divide-y divide-border/10">
                {data.members.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors group/member">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback>{member.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.isOnline ? "Online" : member.lastSeenAt ? `Last seen ${format(new Date(member.lastSeenAt), "MMM d, h:mm a")}` : "Offline"}
                      </p>
                    </div>
                    {member.role === "admin" && (
                      <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                        Admin
                      </span>
                    )}
                    {isCurrentUserAdmin && member.id !== currentUser?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 opacity-0 group-hover/member:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 bg-[var(--clay-bg-app)] shadow-lg rounded-2xl border border-white/40 dark:border-white/5 p-2">
                          {member.role === "admin" ? (
                            <DropdownMenuItem className="cursor-pointer w-full rounded-xl py-3 px-4 text-[14px] font-medium transition-colors hover:bg-[var(--clay-bg-panel)] focus:bg-[var(--clay-bg-panel)] mb-1" onClick={() => updateRoleMutation.mutate({ userId: member.id, role: "member" })}>
                              Dismiss as Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="cursor-pointer w-full rounded-xl py-3 px-4 text-[14px] font-medium transition-colors hover:bg-[var(--clay-bg-panel)] focus:bg-[var(--clay-bg-panel)] mb-1" onClick={() => updateRoleMutation.mutate({ userId: member.id, role: "admin" })}>
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="cursor-pointer w-full rounded-xl py-3 px-4 text-[14px] font-medium transition-colors hover:bg-destructive/10 focus:bg-destructive/10 text-destructive focus:text-destructive" onClick={() => removeMemberMutation.mutate(member.id)}>
                            Remove from Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
