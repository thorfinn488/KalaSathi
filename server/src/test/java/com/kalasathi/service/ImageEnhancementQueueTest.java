package com.kalasathi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kalasathi.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ImageEnhancementQueueTest {
    @Test
    @SuppressWarnings("unchecked")
    void redisFailureIsReturnedAsServiceUnavailable() {
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        ListOperations<String, String> listOperations = mock(ListOperations.class);
        when(redisTemplate.opsForList()).thenReturn(listOperations);
        when(listOperations.rightPush(eq("kalasathi:jobs:image-enhancement"), anyString()))
                .thenThrow(new RedisConnectionFailureException("Redis unavailable"));
        ImageEnhancementQueue queue = new ImageEnhancementQueue(redisTemplate, new ObjectMapper());

        ApiException exception = assertThrows(
                ApiException.class, () -> queue.enqueue("prod_test", "media_test", "source-key"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
        assertEquals("SERVICE_UNAVAILABLE", exception.getCode());
    }

    @Test
    @SuppressWarnings("unchecked")
    void jobPayloadCanBeReadFromRedis() throws Exception {
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        ListOperations<String, String> listOperations = mock(ListOperations.class);
        when(redisTemplate.opsForList()).thenReturn(listOperations);
        when(listOperations.leftPop(eq("kalasathi:jobs:image-enhancement"), eq(java.time.Duration.ofSeconds(1))))
                .thenReturn("""
                        {"jobId":"job_test","productId":"prod_test","mediaId":"media_test",
                         "objectKey":"products/prod_test/image/media_test.jpeg","retryAttempt":1}
                        """);
        ImageEnhancementQueue queue = new ImageEnhancementQueue(redisTemplate, new ObjectMapper());

        ImageEnhancementJob job = queue.poll(java.time.Duration.ofSeconds(1)).orElseThrow();

        assertEquals("job_test", job.jobId());
        assertEquals("prod_test", job.productId());
        assertEquals("media_test", job.mediaId());
        assertEquals(1, job.retryAttempt());
    }
}
