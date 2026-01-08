import { Router } from "express";
import multer from "multer";
import path from "path";
import { z } from "zod";
import env from "../../config";
import { authMiddleware, AuthedRequest } from "../../lib/authMiddleware";
import { parsePagination } from "../../lib/validators";
import { createPost, deletePost, getPostById, listFeed } from "./posts.service";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `post-${Date.now()}${ext}`);
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

const createSchema = z.object({
  text: z.string().min(1).max(1000),
  shareOf: z.string().optional()
});

router.post("/posts", authMiddleware, upload.single("media"), async (req: AuthedRequest, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const mediaType = req.file ? req.file.mimetype : undefined;
    const post = await createPost({
      authorId: req.user!.userId,
      text: data.text,
      mediaUrl,
      mediaType,
      shareOf: data.shareOf ?? null
    });
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
});

router.get("/feed", async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const feed = await listFeed(page, limit);
    res.json({ success: true, data: feed });
  } catch (error) {
    next(error);
  }
});

router.get("/posts/:id", async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
});

router.delete("/posts/:id", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    await deletePost(req.params.id, req.user!.userId);
    res.json({ success: true, message: "Post deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
