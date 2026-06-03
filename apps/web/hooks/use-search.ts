"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { apiClient } from "@/services/api-client";

export type SearchResult = {
  users: Array<{ id: string; username: string; avatarUrl?: string | null; bio?: string | null; isOnline: boolean }>;
  chats: Array<{ chatId: string; type: "direct" | "group"; groupName?: string | null }>;
  messages: Array<{ id: string; chatId: string; body?: string | null; createdAt: string; senderName: string }>;
};

export const useSearch = (query: string) => {
  const debounced = useDebounce(query, 300);

  return useQuery({
    queryKey: ["search", debounced],
    queryFn: () => apiClient<SearchResult>(`/api/search?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length > 0
  });
};
