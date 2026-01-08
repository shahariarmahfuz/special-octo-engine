import path from "path";
import { nanoid } from "nanoid";
import { readJson, updateJson } from "../../lib/fileStore";

export interface Reaction {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

const reactionsFile = path.resolve("src/storage/data/reactions.json");

export async function addReaction(postId: string, userId: string): Promise<Reaction> {
  const reactions = await readJson<Reaction[]>(reactionsFile, []);
  const existing = reactions.find((r) => r.postId === postId && r.userId === userId);
  if (existing) {
    return existing;
  }
  const reaction: Reaction = {
    id: nanoid(),
    postId,
    userId,
    createdAt: new Date().toISOString()
  };
  await updateJson<Reaction[]>(reactionsFile, [], (current) => [...current, reaction]);
  return reaction;
}

export async function removeReaction(postId: string, userId: string): Promise<void> {
  await updateJson<Reaction[]>(reactionsFile, [], (current) => current.filter((r) => !(r.postId === postId && r.userId === userId)));
}
