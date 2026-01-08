import http from "http";
import { Server } from "socket.io";
import app from "./app";
import env from "./config";
import { verifySocketAuth } from "./modules/messages/socket";
import { createMessage } from "./modules/messages/messages.service";
import { getChatById } from "./modules/chats/chats.service";

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: env.corsOrigin, credentials: true }
});

io.use(verifySocketAuth);

io.on("connection", (socket) => {
  const user = socket.data.user;
  if (user) {
    socket.join(`user:${user.userId}`);
  }

  socket.on("dm:join", (payload: { chatId: string }) => {
    const { chatId } = payload;
    if (chatId) {
      socket.join(`chat:${chatId}`);
    }
  });

  socket.on(
    "dm:message",
    async (
      payload: { chatId: string; text: string; mediaUrl?: string | null; mediaType?: string | null },
      callback?: (response: { success: boolean; message?: string; data?: unknown }) => void
    ) => {
      try {
        const { chatId, text, mediaUrl, mediaType } = payload;
        const chat = await getChatById(chatId);
        if (!chat || !chat.participantIds.includes(user.userId)) {
          callback?.({ success: false, message: "Chat not found" });
          return;
        }
        const message = await createMessage({ chatId, senderId: user.userId, text, mediaUrl, mediaType });
        chat.participantIds.forEach((participantId) => {
          io.to(`user:${participantId}`).emit("dm:message:new", message);
        });
        callback?.({ success: true, data: message });
      } catch (error) {
        callback?.({ success: false, message: "Message failed" });
      }
    }
  );

  socket.on("typing", (payload: { chatId: string; isTyping: boolean }) => {
    const { chatId, isTyping } = payload;
    socket.to(`chat:${chatId}`).emit("typing", { chatId, userId: user.userId, isTyping });
  });
});

server.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on ${env.port}`);
});
