import { Router } from "express";
import multer from "multer";
import path from "path";
import { z } from "zod";
import env from "../../config";
import { authMiddleware, AuthedRequest } from "../../lib/authMiddleware";
import { getProfileByUsername, updateProfile } from "./profiles.service";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only images allowed"));
      return;
    }
    cb(null, true);
  }
});

const updateSchema = z.object({
  displayName: z.string().min(1).optional(),
  bio: z.string().max(300).optional(),
  privacy: z
    .object({
      showEmail: z.boolean().optional()
    })
    .optional()
});

router.get("/:username", async (req, res, next) => {
  try {
    const profile = await getProfileByUsername(req.params.username);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

router.patch("/me", authMiddleware, upload.single("avatar"), async (req: AuthedRequest, res, next) => {
  try {
    const rawBody = req.body as { privacy?: string };
    const parsedBody = { ...req.body } as Record<string, unknown>;
    if (typeof rawBody.privacy === "string") {
      try {
        parsedBody.privacy = JSON.parse(rawBody.privacy);
      } catch {
        parsedBody.privacy = undefined;
      }
    }
    const data = updateSchema.parse(parsedBody);
    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const profile = await updateProfile(req.user!.userId, {
      ...data,
      avatarUrl,
      privacy: data.privacy ? { showEmail: data.privacy.showEmail ?? false } : undefined
    });
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

export default router;
