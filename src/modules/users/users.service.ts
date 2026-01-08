import path from "path";
import { readJson, updateJson } from "../../lib/fileStore";
import { HttpError } from "../../lib/errorHandler";
import { User, Profile } from "../auth/auth.service";

const usersFile = path.resolve("src/storage/data/users.json");
const profilesFile = path.resolve("src/storage/data/profiles.json");

export async function getUserWithProfile(userId: string): Promise<{ user: User; profile: Profile }> {
  const users = await readJson<User[]>(usersFile, []);
  const profiles = await readJson<Profile[]>(profilesFile, []);
  const user = users.find((u) => u.id === userId);
  const profile = profiles.find((p) => p.userId === userId);
  if (!user || !profile) {
    throw new HttpError(404, "User not found");
  }
  return { user, profile };
}

export async function updateUser(userId: string, updates: { email?: string }): Promise<User> {
  const users = await readJson<User[]>(usersFile, []);
  const user = users.find((u) => u.id === userId);
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  if (updates.email && users.some((u) => u.email === updates.email && u.id !== userId)) {
    throw new HttpError(400, "Email already in use");
  }

  const updatedUser = { ...user, email: updates.email ?? user.email };
  await updateJson<User[]>(usersFile, [], (current) => current.map((u) => (u.id === userId ? updatedUser : u)));
  return updatedUser;
}
