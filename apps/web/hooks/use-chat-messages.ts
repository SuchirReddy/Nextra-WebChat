"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiClient } from "@/services/api-client";
import { useChatStore } from "@/store/chat-store";
import { ChatMessage } from "@/types/chat";

const PAGE_SIZE = 30;

export const useChatMessages = (chatId: string) => {
  const setMessages = useChatStore((state) => state.setMessages);

  const query = useInfiniteQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      apiClient<ChatMessage[]>(
        `/api/chats/${chatId}/messages?limit=${PAGE_SIZE}${pageParam ? `&before=${encodeURIComponent(pageParam)}` : ""}`
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      return lastPage[lastPage.length - 1]?.createdAt;
    }
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }

    const merged = query.data.pages.flat();
    setMessages(chatId, merged);
  }, [chatId, query.data, setMessages]);

  return query;
};
