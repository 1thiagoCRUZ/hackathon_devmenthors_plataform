import { Queue } from 'bullmq';
import { redisConnection } from './redis.js';

export const uploadQueue = new Queue('upload-queue', { connection: redisConnection });
