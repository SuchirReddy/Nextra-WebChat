import { db } from "../lib/db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function run() {
  const allUsers = await db.select().from(users);
  
  for (const user of allUsers) {
    console.log(`Making ${user.username} an admin...`);
    await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
  }

  console.log("Done");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
