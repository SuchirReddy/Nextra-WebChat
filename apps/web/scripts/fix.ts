import { db } from "../lib/db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function run() {
  const allUsers = await db.select().from(users);
  console.log("Current users:", allUsers.map((u) => u.username));

  for (const user of allUsers) {
    if (user.username.includes("_")) {
      // Split by underscore, capitalize each word
      let newName = user.username
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Example: Test User 3ef -> Test User (3ef) if the last part is short hex
      newName = newName.replace(/ ([0-9a-f]{3,8})$/i, " ($1)");
      
      console.log(`Updating ${user.username} to ${newName}`);
      await db.update(users).set({ username: newName }).where(eq(users.id, user.id));
    }
  }

  console.log("Done");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
