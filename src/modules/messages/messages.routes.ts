import { Router } from "express";
import { authMiddleware, AuthedRequest } from "../../lib/authMiddleware";
import { getChatById } from "../chats/chats.service";
import { listMessages } from "./messages.service";

const router = Router();

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

export default router;
