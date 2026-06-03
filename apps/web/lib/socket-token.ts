import { SignJWT } from "jose";
import { env } from "@/lib/env";

const encoder = new TextEncoder();

export const createSocketToken = async (payload: { userId: string; clerkId: string }) =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(encoder.encode(env.SOCKET_JWT_SECRET));
