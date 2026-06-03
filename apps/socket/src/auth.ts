import { jwtVerify } from "jose";
import { env } from "./env.js";

const encoder = new TextEncoder();

export type SocketClaims = {
  userId: string;
  clerkId: string;
};

export const verifySocketToken = async (token?: string): Promise<SocketClaims> => {
  if (!token) {
    throw new Error("Missing auth token");
  }

  const { payload } = await jwtVerify(token, encoder.encode(env.SOCKET_JWT_SECRET));

  const userId = payload.userId;
  const clerkId = payload.clerkId;

  if (typeof userId !== "string" || typeof clerkId !== "string") {
    throw new Error("Invalid token claims");
  }

  return { userId, clerkId };
};
