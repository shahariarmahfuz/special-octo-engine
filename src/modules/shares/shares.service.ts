import path from "path";
import { nanoid } from "nanoid";
import { readJson, updateJson } from "../../lib/fileStore";

export interface Share {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

const sharesFile = path.resolve("src/storage/data/shares.json");

export async function addShare(postId: string, userId: string): Promise<Share> {
  const share: Share = {
    id: nanoid(),
    postId,
    userId,
    createdAt: new Date().toISOString()
  };
  await updateJson<Share[]>(sharesFile, [], (current) => [...current, share]);
  return share;
}

export async function listSharesByUser(userId: string): Promise<Share[]> {
  const shares = await readJson<Share[]>(sharesFile, []);
  return shares.filter((s) => s.userId === userId);
}
