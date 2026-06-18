import Redis from "ioredis";

type MemoryStore = Map<string, { value: string; expiresAt?: number }>;

const memoryStore: MemoryStore = new Map();

class MemoryRedis {
  async get(key: string): Promise<string | null> {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<"OK"> {
    const expiresAt = mode === "EX" && duration ? Date.now() + duration * 1000 : undefined;
    memoryStore.set(key, { value, expiresAt });
    return "OK";
  }

  async del(key: string): Promise<number> {
    return memoryStore.delete(key) ? 1 : 0;
  }

  async publish(): Promise<number> {
    return 0;
  }

  async subscribe(): Promise<void> {}
}

let redisClient: Redis | MemoryRedis | null = null;

export function getRedis(): Redis | MemoryRedis {
  if (redisClient) return redisClient;

  if (process.env.REDIS_URL) {
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      connectTimeout: 10_000,
    });
    client.on("error", (err) => {
      console.warn("[redis]", err.message);
    });
    redisClient = client;
  } else {
    redisClient = new MemoryRedis();
  }
  return redisClient;
}

export async function cacheRoomState(roomCode: string, state: unknown, ttl = 60) {
  const redis = getRedis();
  await redis.set(`room:${roomCode}`, JSON.stringify(state), "EX", ttl);
}

export async function getCachedRoomState<T>(roomCode: string): Promise<T | null> {
  const redis = getRedis();
  const data = await redis.get(`room:${roomCode}`);
  return data ? (JSON.parse(data) as T) : null;
}

export async function cacheJson<T>(key: string, value: T, ttlSeconds = 30): Promise<void> {
  const redis = getRedis();
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  const data = await redis.get(key);
  return data ? (JSON.parse(data) as T) : null;
}
