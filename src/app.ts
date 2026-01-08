import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import env from "./config";
import authRouter from "./modules/auth/auth.routes";
import usersRouter from "./modules/users/users.routes";
import profilesRouter from "./modules/profiles/profiles.routes";
import postsRouter from "./modules/posts/posts.routes";
import commentsRouter from "./modules/comments/comments.routes";
import reactionsRouter from "./modules/reactions/reactions.routes";
import sharesRouter from "./modules/shares/shares.routes";
import chatsRouter from "./modules/chats/chats.routes";
import messagesRouter from "./modules/messages/messages.routes";
import { errorHandler } from "./lib/errorHandler";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.resolve(env.uploadDir)));

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/profiles", profilesRouter);
app.use("/", postsRouter);
app.use("/posts", commentsRouter);
app.use("/posts", reactionsRouter);
app.use("/posts", sharesRouter);
app.use("/chats", chatsRouter);
app.use("/chats", messagesRouter);

app.use(errorHandler);

export default app;
