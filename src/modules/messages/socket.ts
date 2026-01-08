import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import env from "../../config";
import { AuthPayload } from "../../lib/authMiddleware";

export function verifySocketAuth(socket: Socket, next: (err?: Error) => void): void {
  const token = (socket.handshake.auth?.token as string | undefined) ??
    (typeof socket.handshake.query.token === "string" ? socket.handshake.query.token : undefined);
  if (!token) {
    next(new Error("Unauthorized"));
    return;
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    socket.data.user = payload;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
}
