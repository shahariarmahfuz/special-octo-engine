import { Router } from "express";
import { authMiddleware, AuthedRequest } from "../../lib/authMiddleware";
import { addReaction, removeReaction } from "./reactions.service";

const router = Router();

router.post("/:id/like", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const reaction = await addReaction(req.params.id, req.user!.userId);
    res.status(201).json({ success: true, data: reaction });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/like", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    await removeReaction(req.params.id, req.user!.userId);
    res.json({ success: true, message: "Unliked" });
  } catch (error) {
    next(error);
  }
});

export default router;
