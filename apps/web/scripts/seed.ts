import { db } from "@/lib/db";
import { chatMembers, chats, groups, groupMembers, messages, users } from "@/drizzle/schema";

const run = async () => {
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) {
    console.log("Seed skipped: users already exist");
    return;
  }

  const [alice, bob, admin] = await db
    .insert(users)
    .values([
      {
        clerkId: "seed_alice",
        email: "alice@example.com",
        username: "alice",
        bio: "Product designer",
        role: "user"
      },
      {
        clerkId: "seed_bob",
        email: "bob@example.com",
        username: "bob",
        bio: "Full-stack engineer",
        role: "user"
      },
      {
        clerkId: "seed_admin",
        email: "admin@example.com",
        username: "admin",
        bio: "Moderation lead",
        role: "admin"
      }
    ])
    .returning();

  const [directChat, groupChat] = await db
    .insert(chats)
    .values([
      { type: "direct", createdById: alice.id, lastMessageAt: new Date() },
      { type: "group", createdById: admin.id, lastMessageAt: new Date() }
    ])
    .returning();

  await db.insert(chatMembers).values([
    { chatId: directChat.id, userId: alice.id, role: "member" },
    { chatId: directChat.id, userId: bob.id, role: "member" },
    { chatId: groupChat.id, userId: alice.id, role: "member" },
    { chatId: groupChat.id, userId: bob.id, role: "member" },
    { chatId: groupChat.id, userId: admin.id, role: "admin" }
  ]);

  const [group] = await db
    .insert(groups)
    .values({
      chatId: groupChat.id,
      name: "Launch Team",
      description: "Ship the MVP with confidence",
      createdById: admin.id
    })
    .returning();

  await db.insert(groupMembers).values([
    { groupId: group.id, userId: alice.id, role: "member" },
    { groupId: group.id, userId: bob.id, role: "member" },
    { groupId: group.id, userId: admin.id, role: "admin" }
  ]);

  await db.insert(messages).values([
    {
      chatId: directChat.id,
      senderId: alice.id,
      body: "Hey Bob, welcome to Nextra!",
      deliveredAt: new Date()
    },
    {
      chatId: directChat.id,
      senderId: bob.id,
      body: "Looks great. Realtime feels smooth.",
      deliveredAt: new Date()
    },
    {
      chatId: groupChat.id,
      senderId: admin.id,
      body: "Welcome everyone. Let's launch this week.",
      deliveredAt: new Date()
    }
  ]);

  console.log("Seed completed");
};

run()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
