import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import env from "../config";

export interface AuthPayload {
  userId: string;
  username: string;
}

export interface AuthedRequest extends Request {
  user?: AuthPayload;
}

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.replace("Bearer ", "") : undefined;

  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
}
