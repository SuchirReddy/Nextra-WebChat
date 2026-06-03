"use client";

import Image from "next/image";
import { format, isToday, isYesterday } from "date-fns";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash, Check, CheckCheck, X, SmilePlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types/chat";
import { apiClient } from "@/services/api-client";
import { getExistingSocket } from "@/services/socket-client";
import { SOCKET_EVENTS } from "@/lib/constants";

const formatMessageTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const timeStr = format(date, "h:mm a");
  if (isToday(date)) return timeStr;
  if (isYesterday(date)) return `Yesterday, ${timeStr}`;
  return `${format(date, "d MMM")}, ${timeStr}`;
};

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😢", "🙏"];

export const MessageBubble = ({ message, own, currentUserId }: { message: ChatMessage & { deliveredAt?: string | null }; own: boolean; currentUserId?: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(message.body ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [optimisticReactions, setOptimisticReactions] = useState<typeof message.reactions>(message.reactions);

  useEffect(() => {
    setOptimisticReactions(message.reactions);
  }, [message.reactions]);

  const handleDelete = async () => {
    try {
      await apiClient<ChatMessage>(`/api/messages/${message.id}`, { method: "DELETE" });
      getExistingSocket()?.emit(SOCKET_EVENTS.CHAT_MESSAGE_DELETE, { chatId: message.chatId, messageId: message.id });
    } catch (error) {
      console.error("Failed to delete message", error);
    }
  };

  const handleEditSave = async () => {
    if (!editBody.trim() || editBody === message.body) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      const updatedMsg = await apiClient<{ id: string; chatId: string; body: string; editedAt: string }>(`/api/messages/${message.id}`, {
        method: "PATCH",
        body: JSON.stringify({ body: editBody.trim() })
      });
      getExistingSocket()?.emit(SOCKET_EVENTS.CHAT_MESSAGE_EDIT, {
        chatId: message.chatId,
        messageId: message.id,
        body: updatedMsg.body,
        editedAt: updatedMsg.editedAt
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit message", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!currentUserId) return;
    setReactionOpen(false); // Close popover instantly

    const hasReacted = optimisticReactions.some(r => r.emoji === emoji && r.userId === currentUserId);
    const action = hasReacted ? "remove" : "add";

    // Optimistic UI update
    const newReactions = hasReacted 
      ? optimisticReactions.filter(r => !(r.emoji === emoji && r.userId === currentUserId))
      : [...optimisticReactions, { id: "temp", emoji, userId: currentUserId }];
    setOptimisticReactions(newReactions);

    try {
      const method = hasReacted ? "DELETE" : "POST";
      await apiClient(`/api/messages/${message.id}/reactions`, {
        method,
        body: JSON.stringify({ emoji })
      });
      getExistingSocket()?.emit(SOCKET_EVENTS.CHAT_MESSAGE_REACTION, {
        chatId: message.chatId,
        messageId: message.id,
        emoji,
        userId: currentUserId,
        action
      });
    } catch (error) {
      console.error("Failed to toggle reaction", error);
      toast.error(error instanceof Error ? error.message : "Failed to toggle reaction");
      // Revert on error
      setOptimisticReactions(message.reactions);
    }
  };

  return (
    <div className={cn("flex gap-2 px-4 md:px-[5%] lg:px-12 py-2 group", own ? "justify-end" : "justify-start")}>
      {!own ? (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.senderAvatar || undefined} alt={message.senderName} />
          <AvatarFallback>{message.senderName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      ) : null}

      <div className="flex flex-col gap-1 max-w-[75%] min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {!message.deletedAt && !isEditing && (
            <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity", own ? "flex-row" : "flex-row-reverse")}>
              <Popover open={reactionOpen} onOpenChange={setReactionOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <SmilePlus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1.5" side="top" align={own ? "end" : "start"}>
                  <div className="flex items-center gap-1">
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          handleReaction(emoji);
                        }}
                        className="rounded hover:bg-black/5 dark:hover:bg-white/5 p-1.5 text-lg transition-transform hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {own && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          <div className={cn(
            "relative px-4 pt-3 pb-2 text-[15px] shadow-clay-sm dark:shadow-clay-dark-sm border border-white/40 dark:border-white/5 min-w-0 flex flex-col transition-all", 
            own 
              ? "bg-[var(--clay-msg-out)] text-foreground rounded-3xl rounded-tr-xl" 
              : "bg-[var(--clay-msg-in)] text-foreground rounded-3xl rounded-tl-xl"
          )}>
            {!own ? <p className="mb-1 text-xs font-semibold">{message.senderName}</p> : null}
            {message.deletedAt ? (
              <p className="text-sm italic opacity-80">Message deleted</p>
            ) : isEditing ? (
              <div className="flex items-center gap-2">
                <Input 
                  value={editBody} 
                  onChange={(e) => setEditBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditSave();
                    if (e.key === "Escape") setIsEditing(false);
                  }}
                  className="h-8 min-w-[200px] text-foreground"
                  autoFocus
                  disabled={isSaving}
                />
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleEditSave} disabled={isSaving}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                {message.body ? <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p> : null}
                {message.attachments.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment) =>
                      attachment.type === "image" ? (
                        <Image
                          key={attachment.id}
                          src={attachment.url}
                          alt={attachment.fileName}
                          width={260}
                          height={180}
                          className="rounded-lg border border-border object-cover"
                        />
                      ) : (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg border border-border px-3 py-2 text-xs underline"
                        >
                          {attachment.fileName}
                        </a>
                      )
                    )}
                  </div>
                ) : null}
              </>
            )}
            <div className={cn("self-end ml-3 flex items-center justify-end gap-1 text-[11px] text-muted-foreground/80 mt-1", optimisticReactions.length > 0 ? "mb-[10px]" : "")}>
              {message.editedAt && !message.deletedAt ? <span className="italic">edited</span> : null}
              <span title={format(new Date(message.createdAt), "PPpp")}>
                {formatMessageTime(message.createdAt)}
              </span>
              {own ? (
                <span className="ml-0.5 flex items-center">
                  {message.readBy.filter(id => id !== message.senderId).length > 0 ? (
                    <CheckCheck className="h-[14px] w-[14px] text-blue-500" />
                  ) : message.deliveredAt ? (
                    <CheckCheck className="h-[14px] w-[14px] text-muted-foreground/60" />
                  ) : (
                    <Check className="h-[14px] w-[14px] text-muted-foreground/60" />
                  )}
                </span>
              ) : null}
            </div>
            {optimisticReactions.length > 0 && !message.deletedAt ? (
              <div className={cn("absolute -bottom-3.5 flex flex-wrap gap-1 z-10", own ? "right-2" : "right-2")}>
                {Object.entries(
                  optimisticReactions.reduce<Record<string, number>>((acc, reaction) => {
                    acc[reaction.emoji] = (acc[reaction.emoji] ?? 0) + 1;
                    return acc;
                  }, {})
                ).map(([emoji, count]) => (
                  <Badge key={emoji} variant="outline" className="h-6 px-1.5 text-[11px] bg-background border shadow-sm flex items-center gap-1 rounded-full cursor-pointer hover:bg-muted" onClick={() => handleReaction(emoji)}>
                    <span>{emoji}</span>
                    {count > 1 ? <span className="text-[10px] text-muted-foreground ml-0.5">{count}</span> : null}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
