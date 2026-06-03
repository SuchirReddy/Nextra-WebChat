"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiClient } from "@/services/api-client";
import { useChatStore } from "@/store/chat-store";
import { ChatListItem } from "@/types/chat";

export const useChats = () => {
  const setChats = useChatStore((state) => state.setChats);

  const query = useQuery({
    queryKey: ["chats"],
    queryFn: () => apiClient<ChatListItem[]>("/api/chats")
  });

  useEffect(() => {
    if (query.data) {
      setChats(query.data);
    }
  }, [query.data, setChats]);

  return query;
};
