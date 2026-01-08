import path from "path";
import { readJson, updateJson } from "../../lib/fileStore";
import { HttpError } from "../../lib/errorHandler";
import { Profile } from "../auth/auth.service";

const profilesFile = path.resolve("src/storage/data/profiles.json");

export async function getProfileByUsername(username: string): Promise<Profile> {
  const profiles = await readJson<Profile[]>(profilesFile, []);
  const profile = profiles.find((p) => p.username === username);
  if (!profile) {
    throw new HttpError(404, "Profile not found");
  }
  return profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
  const profiles = await readJson<Profile[]>(profilesFile, []);
  const profile = profiles.find((p) => p.userId === userId);
  if (!profile) {
    throw new HttpError(404, "Profile not found");
  }

  const updated: Profile = {
    ...profile,
    displayName: updates.displayName ?? profile.displayName,
    bio: updates.bio ?? profile.bio,
    avatarUrl: updates.avatarUrl ?? profile.avatarUrl,
    privacy: updates.privacy ?? profile.privacy
  };

  await updateJson<Profile[]>(profilesFile, [], (current) => current.map((p) => (p.userId === userId ? updated : p)));
  return updated;
}
