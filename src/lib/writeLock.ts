type Task<T> = () => Promise<T>;

const queues = new Map<string, Promise<unknown>>();

export async function withWriteLock<T>(key: string, task: Task<T>): Promise<T> {
  const previous = queues.get(key) ?? Promise.resolve();
  let release: () => void = () => undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  queues.set(key, previous.then(() => current));

  await previous;
  try {
    const result = await task();
    return result;
  } finally {
    release();
    if (queues.get(key) === current) {
      queues.delete(key);
    }
  }
}
