import { Router } from "express";
import { z } from "zod";
import { authMiddleware, AuthedRequest } from "../../lib/authMiddleware";
import { addComment, listComments } from "./comments.service";

const router = Router();

const commentSchema = z.object({
  text: z.string().min(1).max(500)
});

router.post("/:id/comments", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const data = commentSchema.parse(req.body);
    const comment = await addComment({
      postId: req.params.id,
      authorId: req.user!.userId,
      text: data.text
    });
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/comments", async (req, res, next) => {
  try {
    const comments = await listComments(req.params.id);
    res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
});

export default router;
