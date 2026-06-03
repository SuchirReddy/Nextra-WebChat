"use client";

import { ApiResponse } from "@/types/api";

export async function apiClient<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  const payload = (await res.json()) as ApiResponse<T>;

  if (!res.ok || "error" in payload) {
    throw new Error("error" in payload ? payload.error : "Request failed");
  }

  return payload.data;
}
