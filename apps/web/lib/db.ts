import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/drizzle/schema";
import { env } from "@/lib/env";

const client = postgres(env.DATABASE_URL, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false
});

export const db = drizzle(client, { schema, casing: "snake_case" });
