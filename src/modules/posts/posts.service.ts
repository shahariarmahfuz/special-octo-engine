import path from "path";
import { nanoid } from "nanoid";
import { readJson, updateJson } from "../../lib/fileStore";
import { HttpError } from "../../lib/errorHandler";

export interface Post {
  id: string;
  authorId: string;
  text: string;
  mediaUrl: string | null;
  mediaType: string | null;
  shareOf: string | null;
  createdAt: string;
}

const postsFile = path.resolve("src/storage/data/posts.json");

export async function createPost(input: { authorId: string; text: string; mediaUrl?: string; mediaType?: string; shareOf?: string | null }): Promise<Post> {
  const post: Post = {
    id: nanoid(),
    authorId: input.authorId,
    text: input.text,
    mediaUrl: input.mediaUrl ?? null,
    mediaType: input.mediaType ?? null,
    shareOf: input.shareOf ?? null,
    createdAt: new Date().toISOString()
  };
  await updateJson<Post[]>(postsFile, [], (current) => [post, ...current]);
  return post;
}

export async function getPostById(postId: string): Promise<Post> {
  const posts = await readJson<Post[]>(postsFile, []);
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    throw new HttpError(404, "Post not found");
  }
  return post;
}

export async function listFeed(page: number, limit: number): Promise<{ items: Post[]; total: number }> {
  const posts = await readJson<Post[]>(postsFile, []);
  const start = (page - 1) * limit;
  const items = posts.slice(start, start + limit);
  return { items, total: posts.length };
}

export async function deletePost(postId: string, userId: string): Promise<void> {
  const posts = await readJson<Post[]>(postsFile, []);
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    throw new HttpError(404, "Post not found");
  }
  if (post.authorId !== userId) {
    throw new HttpError(403, "Not allowed");
  }
  await updateJson<Post[]>(postsFile, [], (current) => current.filter((p) => p.id !== postId));
}
