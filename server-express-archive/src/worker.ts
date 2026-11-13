import { closeDatabase, initializeDatabase } from './db/database.js';
import { IMAGE_ENHANCEMENT_QUEUE, imageQueue, startImageQueue, stopImageQueue } from './queue/image-queue.js';
import { ImageEnhancementJob } from './queue/image-queue.js';
import { enhanceProductImage } from './workers/image-enhancement.js';

async function startWorker(): Promise<void> {
  await initializeDatabase();
  await startImageQueue();
  await imageQueue.work<ImageEnhancementJob>(IMAGE_ENHANCEMENT_QUEUE, async (jobs) => {
    for (const job of jobs) await enhanceProductImage(job.data);
  });
  console.info(`Worker listening on queue "${IMAGE_ENHANCEMENT_QUEUE}".`);
}

async function shutdown(signal: string): Promise<void> {
  console.info(`${signal} received; stopping image worker.`);
  await stopImageQueue();
  await closeDatabase();
  process.exit(0);
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

startWorker().catch(async (error: unknown) => {
  console.error('Image worker failed to start:', error);
  await stopImageQueue().catch((shutdownError: unknown) => console.error('Queue shutdown failed:', shutdownError));
  await closeDatabase().catch((shutdownError: unknown) => console.error('Database shutdown failed:', shutdownError));
  process.exitCode = 1;
});
