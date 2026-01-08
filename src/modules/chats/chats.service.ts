import path from "path";
import { nanoid } from "nanoid";
import { readJson, updateJson } from "../../lib/fileStore";

export interface Chat {
  id: string;
  participantIds: string[];
  createdAt: string;
}

const chatsFile = path.resolve("src/storage/data/chats.json");

export async function getChatsForUser(userId: string): Promise<Chat[]> {
  const chats = await readJson<Chat[]>(chatsFile, []);
  return chats.filter((chat) => chat.participantIds.includes(userId));
}

export async function getChatById(chatId: string): Promise<Chat | undefined> {
  const chats = await readJson<Chat[]>(chatsFile, []);
  return chats.find((chat) => chat.id === chatId);
}

export async function getOrCreateDmChat(userId: string, otherUserId: string): Promise<Chat> {
  const participants = [userId, otherUserId].sort();
  const chats = await readJson<Chat[]>(chatsFile, []);
  const existing = chats.find((chat) => chat.participantIds.slice().sort().join(":") === participants.join(":"));
  if (existing) {
    return existing;
  }
  const chat: Chat = {
    id: nanoid(),
    participantIds: participants,
    createdAt: new Date().toISOString()
  };
  await updateJson<Chat[]>(chatsFile, [], (current) => [...current, chat]);
  return chat;
}
