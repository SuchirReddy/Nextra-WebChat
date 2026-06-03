"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Search, Loader2 } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";

type SearchResult = {
  id: string;
  chatId: string;
  body: string | null;
  createdAt: string;
  senderName: string;
};

export const ChatSearchPanel = ({ chatId, onClose }: { chatId: string; onClose: () => void }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: results, isLoading } = useQuery({
    queryKey: ["chat-search", chatId, debouncedQuery],
    queryFn: () => apiClient<SearchResult[]>(`/api/chats/${chatId}/search?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: debouncedQuery.length > 0
  });

  return (
    <aside className="flex w-[350px] shrink-0 flex-col border-l border-white/20 dark:border-white/5 bg-[var(--clay-bg-app)]">
      {/* Header */}
      <div className="flex h-[72px] items-center justify-between border-b border-white/20 dark:border-white/5 px-6 shrink-0 shadow-clay-sm dark:shadow-clay-dark-sm z-10 bg-transparent">
        <h2 className="font-semibold text-foreground">Search Messages</h2>
        <button onClick={onClose} className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors focus:outline-none">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 border-b border-white/20 dark:border-white/5 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in chat..." 
            className="h-10 w-full rounded-2xl bg-[var(--clay-bg-panel)] pl-10 border-none shadow-clay-inset dark:shadow-clay-dark-inset focus-visible:ring-0 focus-visible:ring-offset-0" 
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col p-2">
          {isLoading && debouncedQuery ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : results?.length === 0 && debouncedQuery ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Search className="mb-2 h-8 w-8 opacity-20" />
              <p className="text-sm">No messages found for &quot;{debouncedQuery}&quot;</p>
            </div>
          ) : !debouncedQuery ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Search className="mb-2 h-8 w-8 opacity-20" />
              <p className="text-sm">Type to start searching</p>
            </div>
          ) : (
            results?.map((message) => (
              <div 
                key={message.id} 
                className="flex flex-col gap-1 p-3 mx-2 my-1 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => {
                  // Scroll to message in main view would go here.
                  // For now we just focus it or show context.
                }}
              >
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">{message.senderName}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{format(new Date(message.createdAt), "MMM d, h:mm a")}</span>
                </div>
                <p className="text-sm text-foreground/90 line-clamp-3 leading-relaxed">
                  {message.body}
                </p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};
