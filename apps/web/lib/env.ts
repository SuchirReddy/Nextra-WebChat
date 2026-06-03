import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1).default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().min(1).default("/sign-up"),
  SOCKET_SERVER_URL: z.string().url(),
  NEXT_PUBLIC_SOCKET_SERVER_URL: z.string().url(),
  SOCKET_JWT_SECRET: z.string().min(32),
  UPLOADTHING_TOKEN: z.string().min(1),
  UPLOADTHING_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url()
});

export const env = serverSchema.parse(process.env);
