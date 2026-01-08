import { Router } from "express";
import { z } from "zod";
import path from "path";
import { authMiddleware, AuthedRequest } from "../../lib/authMiddleware";
import { readJson } from "../../lib/fileStore";
import { getChatsForUser, getOrCreateDmChat } from "./chats.service";
import { User } from "../auth/auth.service";

const router = Router();
const usersFile = path.resolve("src/storage/data/users.json");

const dmSchema = z.object({
  username: z.string().min(1)
});

router.get("/", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const chats = await getChatsForUser(req.user!.userId);
    res.json({ success: true, data: chats });
  } catch (error) {
    next(error);
  }
});

router.post("/dm", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const data = dmSchema.parse(req.body);
    const users = await readJson<User[]>(usersFile, []);
    const other = users.find((u) => u.username === data.username);
    if (!other) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    const chat = await getOrCreateDmChat(req.user!.userId, other.id);
    res.status(201).json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
});

export default router;
