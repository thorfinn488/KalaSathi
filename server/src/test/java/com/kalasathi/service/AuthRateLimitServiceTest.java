package com.kalasathi.service;

import com.kalasathi.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.http.HttpStatus;

import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthRateLimitServiceTest {
    private StringRedisTemplate redisTemplate;
    private AuthRateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        rateLimitService = new AuthRateLimitService(redisTemplate, 10, 15);
    }

    @Test
    void eleventhAttemptInWindowIsRateLimited() {
        AtomicLong count = new AtomicLong();
        when(redisTemplate.execute(
                any(RedisScript.class),
                anyList(),
                any(Object[].class)))
                .thenAnswer(invocation -> count.incrementAndGet());

        for (int attempt = 1; attempt <= 10; attempt++) {
            rateLimitService.checkAllowed("login", "127.0.0.1");
        }

        ApiException exception = assertThrows(
                ApiException.class,
                () -> rateLimitService.checkAllowed("login", "127.0.0.1"));

        assertEquals(11, count.get());
        assertEquals("RATE_LIMITED", exception.getCode());
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatus());
    }

    @Test
    void redisOutageFailsClosedWithServiceUnavailable() {
        when(redisTemplate.execute(
                any(RedisScript.class),
                anyList(),
                any(Object[].class)))
                .thenThrow(new RedisConnectionFailureException("Redis unavailable"));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> rateLimitService.checkAllowed("login", "127.0.0.1"));

        assertEquals("SERVICE_UNAVAILABLE", exception.getCode());
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
        assertEquals(
                "Authentication is temporarily unavailable. Please try again later.",
                exception.getMessage());
    }
}
