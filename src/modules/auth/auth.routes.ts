import { Router } from "express";
import { z } from "zod";
import { authMiddleware, AuthedRequest } from "../../lib/authMiddleware";
import { createUser, authenticateUser, getUserById } from "./auth.service";

const router = Router();

const signupSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1)
});

const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1)
});

router.post("/signup", async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const result = await createUser(data);
    res.status(201).json({ success: true, data: { user: result.user, token: result.token } });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authenticateUser(data);
    res.json({ success: true, data: { user: result.user, token: result.token } });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out" });
});

router.get("/me", authMiddleware, async (req: AuthedRequest, res, next) => {
  try {
    const user = await getUserById(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
