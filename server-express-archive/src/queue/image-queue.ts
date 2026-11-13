import { PgBoss } from 'pg-boss';
import { env } from '../config/env.js';

export const IMAGE_ENHANCEMENT_QUEUE = 'image-enhancement';
export const imageQueue = new PgBoss({
  connectionString: env.DATABASE_URL,
  schema: 'pgboss',
});

export async function startImageQueue(): Promise<void> {
  await imageQueue.start();
  await imageQueue.createQueue(IMAGE_ENHANCEMENT_QUEUE);
}

export async function stopImageQueue(): Promise<void> {
  await imageQueue.stop();
}

export interface ImageEnhancementJob {
  productId: string;
  mediaId: string;
  objectKey: string;
}

export async function enqueueImageEnhancement(payload: ImageEnhancementJob): Promise<string> {
  const jobId = await imageQueue.send(IMAGE_ENHANCEMENT_QUEUE, payload, {
    retryLimit: 2,
    retryDelay: 10,
    retryBackoff: true,
  });
  if (!jobId) throw new Error('Image enhancement job could not be queued.');
  return jobId;
}
