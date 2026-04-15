const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, 
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

// Cache for when Redis is unavailable
const memoryFallback = new Map();

redis.on("error", (err) => {
  if (err.code === 'ENOTFOUND') return;
  console.error("Redis Connection Error:", err.message);
});

async function connectRedis() {
  try {
    const pong = await Promise.race([
      redis.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
    ]);
    console.log("Redis connected:", pong);
  } catch (err) {
    console.warn("\n[WARN] Redis unreachable. Using In-Memory fallback for OTPs.");
  }
}

/**
 * Resilient OTP Storage Helpers
 */
const otpStore = {
  set: async (key, value, ttlSeconds) => {
    if (redis.status === 'ready') {
      return await redis.setex(key, ttlSeconds, value);
    }
    // Fallback: Store in local memory
    memoryFallback.set(key, value);
    setTimeout(() => memoryFallback.delete(key), ttlSeconds * 1000);
  },
  get: async (key) => {
    if (redis.status === 'ready') {
      return await redis.get(key);
    }
    return memoryFallback.get(key);
  },
  del: async (key) => {
    if (redis.status === 'ready') {
      return await redis.del(key);
    }
    return memoryFallback.delete(key);
  }
};

module.exports = { redis, connectRedis, otpStore };