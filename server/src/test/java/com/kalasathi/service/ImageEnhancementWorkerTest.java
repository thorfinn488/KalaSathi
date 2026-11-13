package com.kalasathi.service;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;

import java.time.Duration;
import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ImageEnhancementWorkerTest {
    @Test
    void doesNotScheduleMoreThanTwoRetries() {
        ImageEnhancementQueue queue = mock(ImageEnhancementQueue.class);
        ImageEnhancementService enhancementService = mock(ImageEnhancementService.class);
        ImageEnhancementWorker worker = new ImageEnhancementWorker(queue, enhancementService);
        ImageEnhancementJob job = new ImageEnhancementJob(
                "job_test", "prod_test", "media_test", "source-key", 2);

        when(queue.poll(Duration.ofSeconds(1))).thenReturn(Optional.of(job));
        org.mockito.Mockito.doThrow(new IllegalStateException("provider failed"))
                .when(enhancementService).process(job);

        worker.processNextJob();

        verify(enhancementService).process(job);
        verify(queue, never()).retry(job);
    }

    @Test
    void workerContinuesAfterRedisCannotBePolled() {
        ImageEnhancementQueue queue = mock(ImageEnhancementQueue.class);
        ImageEnhancementService enhancementService = mock(ImageEnhancementService.class);
        ImageEnhancementWorker worker = new ImageEnhancementWorker(queue, enhancementService);
        when(queue.poll(Duration.ofSeconds(1))).thenThrow(new RedisConnectionFailureException("Redis unavailable"));

        worker.processNextJob();

        verify(enhancementService, never()).process(org.mockito.ArgumentMatchers.any());
    }
}
