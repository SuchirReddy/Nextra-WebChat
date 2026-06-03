import { neon } from "@neondatabase/serverless";
import { env } from "./env.js";

const sql = neon(env.DATABASE_URL);

export const socketDb = {
  isChatMember: async (chatId: string, userId: string) => {
    const rows = await sql`select 1 from chat_members where chat_id = ${chatId} and user_id = ${userId} limit 1`;
    return rows.length > 0;
  },

  getChatMembers: async (chatId: string) => {
    const rows = await sql`select user_id as "userId" from chat_members where chat_id = ${chatId}`;
    return rows.map((r) => r.userId as string);
  },

  setPresence: async (userId: string, isOnline: boolean) => {
    await sql`
      update users
      set is_online = ${isOnline},
          last_seen_at = ${isOnline ? null : new Date().toISOString()},
          updated_at = ${new Date().toISOString()}
      where id = ${userId}
    `;
  }
};
