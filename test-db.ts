import { db } from "./apps/web/lib/db";
import { chats, messages } from "./apps/web/drizzle/schema";

async function run() {
  const allChats = await db.select().from(chats).limit(1);
  if (allChats.length === 0) {
    console.log("No chats");
    return;
  }
  const chatId = allChats[0].id;
  const msgs = await db.select().from(messages).where((m) => m.chatId === chatId).limit(5);
  console.log("Messages for chat", chatId, ":", msgs.length);
}
run().catch(console.error);
