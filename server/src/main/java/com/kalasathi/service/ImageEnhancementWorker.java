package com.kalasathi.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class ImageEnhancementWorker {
    private static final Logger logger = LoggerFactory.getLogger(ImageEnhancementWorker.class);
    private static final int RETRY_LIMIT = 2;

    private final ImageEnhancementQueue queue;
    private final ImageEnhancementService enhancementService;

    public ImageEnhancementWorker(
            ImageEnhancementQueue queue, ImageEnhancementService enhancementService) {
        this.queue = queue;
        this.enhancementService = enhancementService;
    }

    @Scheduled(fixedDelayString = "${app.image-processing.poll-interval-ms}")
    public void processNextJob() {
        try {
            queue.poll(Duration.ofSeconds(1)).ifPresent(this::process);
        } catch (RedisConnectionFailureException exception) {
            logger.error("Redis is unavailable while polling image enhancement jobs.", exception);
        } catch (RuntimeException exception) {
            logger.error("Image enhancement worker could not read the Redis queue.", exception);
        }
    }

    private void process(ImageEnhancementJob job) {
        try {
            enhancementService.process(job);
        } catch (RuntimeException exception) {
            if (job.retryAttempt() >= RETRY_LIMIT) {
                logger.error("Image enhancement job {} failed after all retries.", job.jobId(), exception);
                return;
            }
            long delayMillis = 10_000L * (1L << job.retryAttempt());
            try {
                Thread.sleep(delayMillis);
                queue.retry(job);
                logger.warn("Image enhancement job {} scheduled for retry {}.", job.jobId(),
                        job.retryAttempt() + 1);
            } catch (InterruptedException interruptedException) {
                Thread.currentThread().interrupt();
                exception.addSuppressed(interruptedException);
                logger.error("Interrupted before retrying image enhancement job {}.", job.jobId(), exception);
            } catch (RuntimeException queueFailure) {
                exception.addSuppressed(queueFailure);
                logger.error("Could not requeue image enhancement job {}.", job.jobId(), exception);
            }
        }
    }
}
