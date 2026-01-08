import { Router } from "express";
import { z } from "zod";
import { authMiddleware, AuthedRequest } from "../../lib/authMiddleware";
import { getUserProfileById, getUserWithProfile, updateUser } from "./users.service";

const router = Router();

const updateSchema = z.object({
  email: z.string().email().optional()
});

router.get("/me", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const data = await getUserWithProfile(req.user!.userId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.patch("/me", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const user = await updateUser(req.user!.userId, data);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const data = await getUserProfileById(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
