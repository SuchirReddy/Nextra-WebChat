"use client";

import { io, Socket } from "socket.io-client";
import { envClient } from "@/utils/env-client";

let socket: Socket | null = null;

export const getSocketClient = (token: string) => {
  if (socket) {
    return socket;
  }

  socket = io(envClient.NEXT_PUBLIC_SOCKET_SERVER_URL, {
    transports: ["websocket"],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    timeout: 15000
  });

  return socket;
};

export const disconnectSocketClient = () => {
  if (!socket) {
    return;
  }
  socket.disconnect();
  socket = null;
};

export const getExistingSocket = () => socket;
