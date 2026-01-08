import express from "express";
import cors from "cors";
import helmet from "helmet";
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
const publicDir = path.resolve("public");

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(publicDir));
app.use("/uploads", express.static(path.resolve(env.uploadDir)));

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/feed", (req, res, next) => {
  if (req.headers.accept?.includes("text/html")) {
    res.sendFile(path.join(publicDir, "feed.html"));
    return;
  }
  next();
});

app.get("/profile", (_req, res) => {
  res.sendFile(path.join(publicDir, "profile.html"));
});

app.get("/settings", (_req, res) => {
  res.sendFile(path.join(publicDir, "profile.html"));
});

app.get("/messages", (_req, res) => {
  res.sendFile(path.join(publicDir, "messages.html"));
});

app.get("/chat", (_req, res) => {
  res.sendFile(path.join(publicDir, "messages.html"));
});

app.get("/photos", (_req, res) => {
  res.sendFile(path.join(publicDir, "photos.html"));
});

app.get("/videos", (_req, res) => {
  res.sendFile(path.join(publicDir, "videos.html"));
});

app.get("/post/:id", (_req, res) => {
  res.sendFile(path.join(publicDir, "post.html"));
});

app.get("/u/:username", (_req, res) => {
  res.sendFile(path.join(publicDir, "profile-view.html"));
});

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
