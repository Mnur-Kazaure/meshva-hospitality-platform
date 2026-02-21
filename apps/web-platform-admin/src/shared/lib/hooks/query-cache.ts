const cache = new Map<string, unknown>();
const listeners = new Set<() => void>();

export function readQueryCache<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function writeQueryCache<T>(key: string, value: T): void {
  cache.set(key, value);
  listeners.forEach((listener) => listener());
}

export function invalidateQueryCache(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
  listeners.forEach((listener) => listener());
}

export function subscribeQueryCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
