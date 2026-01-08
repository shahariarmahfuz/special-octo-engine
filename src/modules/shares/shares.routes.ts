import { Router } from "express";
import { z } from "zod";
import { authMiddleware, AuthedRequest } from "../../lib/authMiddleware";
import { addShare } from "./shares.service";
import { createPost } from "../posts/posts.service";

const router = Router();

const shareSchema = z.object({
  text: z.string().max(1000).optional()
});

router.post("/:id/share", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const data = shareSchema.parse(req.body);
    const share = await addShare(req.params.id, req.user!.userId);
    const repost = await createPost({
      authorId: req.user!.userId,
      text: data.text ?? "",
      shareOf: req.params.id
    });
    res.status(201).json({ success: true, data: { share, repost } });
  } catch (error) {
    next(error);
  }
});

export default router;
