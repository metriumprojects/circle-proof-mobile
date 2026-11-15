import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_MEMORY_ENTRIES = 12;
const STORAGE_PREFIX = 'cp_posts_cache_v1:';

export interface PostsCacheEntry<T = any> {
  posts: T[];
  pagination?: any;
  savedAt: number;
}

const memoryCache = new Map<string, PostsCacheEntry<any>>();

const isFresh = (entry: PostsCacheEntry<any> | null | undefined): entry is PostsCacheEntry<any> => {
  if (!entry || !Array.isArray(entry.posts)) return false;
  return Date.now() - entry.savedAt <= CACHE_TTL_MS;
};

const setMemoryEntry = <T>(key: string, entry: PostsCacheEntry<T>) => {
  if (memoryCache.has(key)) {
    memoryCache.delete(key);
  }
  memoryCache.set(key, entry);
  if (memoryCache.size > MAX_MEMORY_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) {
      memoryCache.delete(oldestKey);
    }
  }
};

export const getCachedPostsSync = <T = any>(key: string): PostsCacheEntry<T> | null => {
  const entry = memoryCache.get(key);
  if (!isFresh(entry)) {
    memoryCache.delete(key);
    return null;
  }
  return entry;
};

export const getCachedPosts = async <T = any>(
  key: string,
): Promise<PostsCacheEntry<T> | null> => {
  const mem = getCachedPostsSync<T>(key);
  if (mem) return mem;

  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PostsCacheEntry<T>;
    if (!isFresh(parsed)) {
      AsyncStorage.removeItem(`${STORAGE_PREFIX}${key}`).catch(() => {});
      return null;
    }
    setMemoryEntry(key, parsed);
    return parsed;
  } catch {
    return null;
  }
};

export const setCachedPosts = async <T = any>(
  key: string,
  posts: T[],
  pagination?: any,
): Promise<void> => {
  const entry: PostsCacheEntry<T> = {
    posts,
    pagination,
    savedAt: Date.now(),
  };
  setMemoryEntry(key, entry);
  try {
    await AsyncStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Non-fatal: cache write failure should never block feed rendering
  }
};

export const invalidatePostsCache = async (prefix?: string): Promise<void> => {
  for (const key of Array.from(memoryCache.keys())) {
    if (!prefix || key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
  try {
    const keys = await AsyncStorage.getAllKeys();
    const targetPrefix = prefix ? `${STORAGE_PREFIX}${prefix}` : STORAGE_PREFIX;
    const matching = keys.filter(k => k.startsWith(targetPrefix));
    if (matching.length > 0) {
      await AsyncStorage.multiRemove(matching);
    }
  } catch {
    // Ignore storage cleanup errors
  }
};

