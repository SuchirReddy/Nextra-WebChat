import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4001),
  DATABASE_URL: z.string().url(),
  SOCKET_JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().url()
});

export const env = schema.parse(process.env);
