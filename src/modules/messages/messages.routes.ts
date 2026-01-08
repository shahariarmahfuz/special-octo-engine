import { Router } from "express";
import multer from "multer";
import path from "path";
import type { Server } from "socket.io";
import { authMiddleware, AuthedRequest } from "../../lib/authMiddleware";
import env from "../../config";
import { getChatById } from "../chats/chats.service";
import { createMessage, listMessages } from "./messages.service";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `message-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/") && !file.mimetype.startsWith("video/")) {
      cb(new Error("Only image/video allowed"));
      return;
    }
    cb(null, true);
  }
});

router.get("/:id/messages", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const chat = await getChatById(req.params.id);
    if (!chat || !chat.participantIds.includes(req.user!.userId)) {
      res.status(404).json({ success: false, message: "Chat not found" });
      return;
    }
    const messages = await listMessages(req.params.id);
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/messages", authMiddleware, upload.single("media"), async (req: AuthedRequest, res, next) => {
  try {
    const chat = await getChatById(req.params.id);
    if (!chat || !chat.participantIds.includes(req.user!.userId)) {
      res.status(404).json({ success: false, message: "Chat not found" });
      return;
    }
    const text = typeof req.body.text === "string" ? req.body.text : "";
    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const mediaType = req.file ? req.file.mimetype : null;
    const message = await createMessage({
      chatId: req.params.id,
      senderId: req.user!.userId,
      text,
      mediaUrl,
      mediaType
    });
    const io = req.app.get("io") as Server | undefined;
    if (io) {
      chat.participantIds.forEach((participantId) => {
        io.to(`user:${participantId}`).emit("dm:message:new", message);
      });
    }
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
});

export default router;
