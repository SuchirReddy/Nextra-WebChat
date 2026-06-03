"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
type NotificationsResponse = {
  items: any[];
  unreadCount: number;
};

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient<NotificationsResponse>("/api/notifications"),
    refetchInterval: 30000 // Poll every 30s as a fallback
  });

  const markAsRead = useMutation({
    mutationFn: () => apiClient("/api/notifications", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  return {
    ...query,
    markAsRead
  };
};
