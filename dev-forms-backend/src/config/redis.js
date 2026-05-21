import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn("Atenção: REDIS_URL não está definida no .env");
}

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  family: 4
});