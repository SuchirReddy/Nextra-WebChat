"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";

export type CurrentUser = {
  id: string;
  clerkId: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  role: "user" | "admin" | "banned";
  bio?: string | null;
};

export const useCurrentUser = () =>
  useQuery({
    queryKey: ["current-user"],
    queryFn: () => apiClient<CurrentUser>("/api/users/sync", { method: "POST" })
  });
