import { createServer } from "http";
import { Server } from "socket.io";
import { env } from "./env.js";
import { verifySocketToken } from "./auth.js";
import { SOCKET_EVENTS } from "./constants.js";
import { socketDb } from "./db.js";

type AuthSocket = {
  userId: string;
  clerkId: string;
};

type SendPayload = {
  id: string;
  chatId: string;
  senderId: string;
  body?: string;
  createdAt: string;
};

const server = createServer();
server.on("request", (req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  }
});

const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket"],
  pingInterval: 20000,
  pingTimeout: 20000
});

const userSockets = new Map<string, Set<string>>();
const typingByChat = new Map<string, Set<string>>();

const emitPresence = async (userId: string, isOnline: boolean) => {
  await socketDb.setPresence(userId, isOnline);
  io.emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
    userId,
    isOnline,
    lastSeenAt: isOnline ? null : new Date().toISOString()
  });
};

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token as string | undefined;
    const claims = await verifySocketToken(token);

    (socket.data as AuthSocket).userId = claims.userId;
    (socket.data as AuthSocket).clerkId = claims.clerkId;

    next();
  } catch (error) {
    next(new Error(error instanceof Error ? error.message : "Unauthorized"));
  }
});

io.on("connection", async (socket) => {
  const auth = socket.data as AuthSocket;
  const userId = auth.userId;

  const sockets = userSockets.get(userId) ?? new Set<string>();
  sockets.add(socket.id);
  userSockets.set(userId, sockets);

  socket.join(`user:${userId}`);
  await emitPresence(userId, true);

  socket.emit(SOCKET_EVENTS.CONNECTED, {
    socketId: socket.id,
    userId
  });

  socket.on(SOCKET_EVENTS.CHAT_JOIN, async (payload: { chatId: string }) => {
    const isMember = await socketDb.isChatMember(payload.chatId, userId);
    if (!isMember) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: "Forbidden" });
      return;
    }

    socket.join(`chat:${payload.chatId}`);
  });

  socket.on(SOCKET_EVENTS.CHAT_LEAVE, (payload: { chatId: string }) => {
    socket.leave(`chat:${payload.chatId}`);
  });

  socket.on(SOCKET_EVENTS.CHAT_MESSAGE_SEND, async (payload: SendPayload) => {
    const isMember = await socketDb.isChatMember(payload.chatId, userId);
    if (!isMember) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: "Forbidden" });
      return;
    }

    const members = await socketDb.getChatMembers(payload.chatId);
    for (const memberId of members) {
      io.to(`user:${memberId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE_NEW, payload);
    }
  });

  socket.on(SOCKET_EVENTS.CHAT_MESSAGE_EDIT, async (payload: { chatId: string; messageId: string; body: string; editedAt: string }) => {
    const isMember = await socketDb.isChatMember(payload.chatId, userId);
    if (!isMember) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: "Forbidden" });
      return;
    }

    const members = await socketDb.getChatMembers(payload.chatId);
    for (const memberId of members) {
      io.to(`user:${memberId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE_EDIT, payload);
    }
  });

  socket.on(SOCKET_EVENTS.CHAT_MESSAGE_DELETE, async (payload: { chatId: string; messageId: string }) => {
    const isMember = await socketDb.isChatMember(payload.chatId, userId);
    if (!isMember) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: "Forbidden" });
      return;
    }

    const members = await socketDb.getChatMembers(payload.chatId);
    for (const memberId of members) {
      io.to(`user:${memberId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE_DELETE, payload);
    }
  });

  socket.on(SOCKET_EVENTS.CHAT_MESSAGE_REACTION, async (payload: { chatId: string; messageId: string; emoji: string; userId: string; action: "add" | "remove" }) => {
    const isMember = await socketDb.isChatMember(payload.chatId, userId);
    if (!isMember) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: "Forbidden" });
      return;
    }

    const members = await socketDb.getChatMembers(payload.chatId);
    for (const memberId of members) {
      io.to(`user:${memberId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE_REACTION, payload);
    }
  });

  socket.on(SOCKET_EVENTS.CHAT_TYPING_START, async (payload: { chatId: string }) => {
    const isMember = await socketDb.isChatMember(payload.chatId, userId);
    if (!isMember) {
      return;
    }

    const set = typingByChat.get(payload.chatId) ?? new Set<string>();
    set.add(userId);
    typingByChat.set(payload.chatId, set);

    io.to(`chat:${payload.chatId}`).emit(SOCKET_EVENTS.CHAT_TYPING_STATE, {
      chatId: payload.chatId,
      userIds: [...set].filter((id) => id !== userId)
    });
  });

  socket.on(SOCKET_EVENTS.CHAT_TYPING_STOP, async (payload: { chatId: string }) => {
    const isMember = await socketDb.isChatMember(payload.chatId, userId);
    if (!isMember) {
      return;
    }

    const set = typingByChat.get(payload.chatId) ?? new Set<string>();
    set.delete(userId);
    typingByChat.set(payload.chatId, set);

    io.to(`chat:${payload.chatId}`).emit(SOCKET_EVENTS.CHAT_TYPING_STATE, {
      chatId: payload.chatId,
      userIds: [...set].filter((id) => id !== userId)
    });
  });

  socket.on(SOCKET_EVENTS.CHAT_READ_RECEIPT, async (payload: { chatId: string; messageId: string }) => {
    const isMember = await socketDb.isChatMember(payload.chatId, userId);
    if (!isMember) {
      return;
    }

    io.to(`chat:${payload.chatId}`).emit(SOCKET_EVENTS.CHAT_READ_UPDATE, {
      chatId: payload.chatId,
      messageId: payload.messageId,
      userId,
      readAt: new Date().toISOString()
    });
  });

  socket.on(SOCKET_EVENTS.CHAT_READ_ALL, async (payload: { chatId: string }) => {
    const isMember = await socketDb.isChatMember(payload.chatId, userId);
    if (!isMember) {
      return;
    }

    const members = await socketDb.getChatMembers(payload.chatId);
    for (const memberId of members) {
      io.to(`user:${memberId}`).emit(SOCKET_EVENTS.CHAT_READ_ALL_UPDATE, {
        chatId: payload.chatId,
        userId,
        readAt: new Date().toISOString()
      });
    }
  });

  socket.on(SOCKET_EVENTS.GROUP_INFO_UPDATE, (payload: { chatId: string }) => {
    io.to(`chat:${payload.chatId}`).emit(SOCKET_EVENTS.GROUP_INFO_UPDATE, payload);
  });

  socket.on(SOCKET_EVENTS.CHAT_CLEARED, async (payload: { chatId: string }) => {
    const isMember = await socketDb.isChatMember(payload.chatId, userId);
    if (!isMember) {
      return;
    }

    const members = await socketDb.getChatMembers(payload.chatId);
    for (const memberId of members) {
      // Don't emit back to the sender since they already handled it optimistically
      if (memberId !== userId) {
        io.to(`user:${memberId}`).emit(SOCKET_EVENTS.CHAT_CLEARED, payload);
      }
    }
  });

  socket.on("disconnect", async () => {
    const userSet = userSockets.get(userId);
    if (userSet) {
      userSet.delete(socket.id);
      if (userSet.size === 0) {
        userSockets.delete(userId);
        await emitPresence(userId, false);
      }
    }

    for (const [chatId, typingSet] of typingByChat.entries()) {
      if (typingSet.has(userId)) {
        typingSet.delete(userId);
        io.to(`chat:${chatId}`).emit(SOCKET_EVENTS.CHAT_TYPING_STATE, {
          chatId,
          userIds: [...typingSet].filter((id) => id !== userId)
        });
      }
    }
  });
});

server.listen(env.PORT, () => {
  console.log(`Socket server running on port ${env.PORT}`);
});
