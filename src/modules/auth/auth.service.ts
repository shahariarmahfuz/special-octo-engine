import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { nanoid } from "nanoid";
import path from "path";
import { readJson, updateJson } from "../../lib/fileStore";
import { HttpError } from "../../lib/errorHandler";

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  privacy: {
    showEmail: boolean;
  };
}

const usersFile = path.resolve("src/storage/data/users.json");
const profilesFile = path.resolve("src/storage/data/profiles.json");

// ✅ Only one secret (Render env var)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing. Set it in Render Environment Variables.");
}

// ✅ No extra env usage; fixed TTL as a literal so TS types match jsonwebtoken v9
const TOKEN_TTL = "7d" as const;

const SIGN_OPTS: SignOptions = { expiresIn: TOKEN_TTL };

export async function createUser(input: {
  username: string;
  email: string;
  password: string;
  displayName: string;
}): Promise<{ user: User; token: string }> {
  const users = await readJson<User[]>(usersFile, []);
  if (users.some((u) => u.username === input.username || u.email === input.email)) {
    throw new HttpError(400, "User already exists");
  }

  const user: User = {
    id: nanoid(),
    username: input.username,
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, 10),
    createdAt: new Date().toISOString(),
  };

  await updateJson<User[]>(usersFile, [], (current) => [...current, user]);

  const profile: Profile = {
    id: nanoid(),
    userId: user.id,
    username: user.username,
    displayName: input.displayName,
    bio: "",
    avatarUrl: null,
    privacy: { showEmail: false },
  };

  await updateJson<Profile[]>(profilesFile, [], (current) => [...current, profile]);

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    SIGN_OPTS
  );

  return { user, token };
}

export async function authenticateUser(input: {
  identifier: string;
  password: string;
}): Promise<{ user: User; token: string }> {
  const users = await readJson<User[]>(usersFile, []);
  const user = users.find(
    (u) => u.username === input.identifier || u.email === input.identifier
  );

  if (!user) {
    throw new HttpError(401, "Invalid credentials");
  }

  const matches = await bcrypt.compare(input.password, user.passwordHash);
  if (!matches) {
    throw new HttpError(401, "Invalid credentials");
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    SIGN_OPTS
  );

  return { user, token };
}

export async function getUserById(userId: string): Promise<User | undefined> {
  const users = await readJson<User[]>(usersFile, []);
  return users.find((u) => u.id === userId);
}
