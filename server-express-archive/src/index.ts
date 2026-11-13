import { app } from './app.js';
import { env } from './config/env.js';
import { closeDatabase, initializeDatabase } from './db/database.js';
import { startImageQueue, stopImageQueue } from './queue/image-queue.js';

async function startServer(): Promise<void> {
  await initializeDatabase();
  await startImageQueue();

  const server = app.listen(env.PORT, () => {
    console.info(`KalaSaathi API listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });

  const shutdown = (signal: string) => {
    console.info(`${signal} received; shutting down API.`);
    server.close(() => {
      void Promise.all([stopImageQueue(), closeDatabase()])
        .then(() => process.exit(0))
        .catch((error: unknown) => {
          console.error('Graceful shutdown failed:', error);
          process.exitCode = 1;
        });
    });
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch(async (error: unknown) => {
  console.error('API failed to start:', error);
  await stopImageQueue().catch((shutdownError: unknown) => console.error('Queue shutdown failed:', shutdownError));
  await closeDatabase().catch((shutdownError: unknown) => console.error('Database shutdown failed:', shutdownError));
  process.exitCode = 1;
});
