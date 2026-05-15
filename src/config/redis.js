// src/config/redis.js
// Configuração do Redis para cache

const Redis = require('ioredis');

let redis = null;

function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true
    });

    redis.on('error', (err) => {
      console.warn('Redis indisponível, usando fallback sem cache:', err.message);
    });
  }
  return redis;
}

// Cache com fallback (funciona mesmo sem Redis)
async function cacheGet(key) {
  try {
    const r = getRedis();
    if (r.status !== 'ready') return null;
    const data = await r.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds = 300) {
  try {
    const r = getRedis();
    if (r.status !== 'ready') return;
    await r.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // silencioso — cache é opcional
  }
}

async function cacheDel(key) {
  try {
    const r = getRedis();
    if (r.status !== 'ready') return;
    await r.del(key);
  } catch {
    // silencioso
  }
}

async function connectRedis() {
  try {
    const r = getRedis();
    await r.connect();
    console.log('✅ Redis conectado');
    return true;
  } catch (err) {
    console.warn('⚠️  Redis não disponível, continuando sem cache:', err.message);
    return false;
  }
}

module.exports = { cacheGet, cacheSet, cacheDel, connectRedis };
