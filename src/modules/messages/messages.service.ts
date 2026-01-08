import path from "path";
import { nanoid } from "nanoid";
import { readJson, updateJson } from "../../lib/fileStore";

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

const messagesFile = path.resolve("src/storage/data/messages.json");

export async function createMessage(input: { chatId: string; senderId: string; text: string }): Promise<Message> {
  const message: Message = {
    id: nanoid(),
    chatId: input.chatId,
    senderId: input.senderId,
    text: input.text,
    createdAt: new Date().toISOString()
  };
  await updateJson<Message[]>(messagesFile, [], (current) => [...current, message]);
  return message;
}

export async function listMessages(chatId: string): Promise<Message[]> {
  const messages = await readJson<Message[]>(messagesFile, []);
  return messages.filter((m) => m.chatId === chatId);
}
