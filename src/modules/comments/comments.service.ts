import path from "path";
import { nanoid } from "nanoid";
import { readJson, updateJson } from "../../lib/fileStore";

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

const commentsFile = path.resolve("src/storage/data/comments.json");

export async function addComment(input: { postId: string; authorId: string; text: string }): Promise<Comment> {
  const comment: Comment = {
    id: nanoid(),
    postId: input.postId,
    authorId: input.authorId,
    text: input.text,
    createdAt: new Date().toISOString()
  };
  await updateJson<Comment[]>(commentsFile, [], (current) => [...current, comment]);
  return comment;
}

export async function listComments(postId: string): Promise<Comment[]> {
  const comments = await readJson<Comment[]>(commentsFile, []);
  return comments.filter((c) => c.postId === postId);
}
