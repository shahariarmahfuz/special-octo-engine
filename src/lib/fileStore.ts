import { promises as fs } from "fs";
import path from "path";
import { withWriteLock } from "./writeLock";

export async function ensureFile<T>(filePath: string, fallback: T): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2));
  }
}

export async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  await ensureFile(filePath, fallback);
  const content = await fs.readFile(filePath, "utf-8");
  try {
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await ensureFile(filePath, data);
  await withWriteLock(filePath, async () => {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  });
}

export async function updateJson<T>(filePath: string, fallback: T, updater: (current: T) => T): Promise<T> {
  await ensureFile(filePath, fallback);
  return withWriteLock(filePath, async () => {
    const current = await readJson(filePath, fallback);
    const updated = updater(current);
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
    return updated;
  });
}
