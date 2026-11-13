package com.kalasathi.service;

import com.kalasathi.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
public class AuthRateLimitService {
    private static final Logger logger = LoggerFactory.getLogger(AuthRateLimitService.class);
    private static final DefaultRedisScript<Long> INCREMENT_WITH_EXPIRY = new DefaultRedisScript<>(
            "local count = redis.call('INCR', KEYS[1]); "
                    + "if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; "
                    + "return count;",
            Long.class);

    private final StringRedisTemplate redisTemplate;
    private final int maxRequests;
    private final Duration window;

    public AuthRateLimitService(
            StringRedisTemplate redisTemplate,
            @Value("${app.rate-limit.auth.max-requests:10}") int maxRequests,
            @Value("${app.rate-limit.auth.window-minutes:15}") long windowMinutes) {
        if (maxRequests <= 0 || windowMinutes <= 0) {
            throw new IllegalArgumentException("Auth rate-limit values must be greater than zero.");
        }
        this.redisTemplate = redisTemplate;
        this.maxRequests = maxRequests;
        this.window = Duration.ofMinutes(windowMinutes);
    }

    public void checkAllowed(String operation, String clientAddress) {
        String key = "rate-limit:auth:" + operation + ":" + clientAddress;
        Long requestCount;
        try {
            requestCount = redisTemplate.execute(
                    INCREMENT_WITH_EXPIRY,
                    List.of(key),
                    Long.toString(window.toSeconds()));
        } catch (RedisConnectionFailureException exception) {
            logger.error("Redis is unavailable; rejecting {} request from {}.", operation, clientAddress, exception);
            throw new ApiException(
                    "SERVICE_UNAVAILABLE",
                    "Authentication is temporarily unavailable. Please try again later.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
        if (requestCount == null) {
            throw new IllegalStateException("Redis did not return an auth rate-limit count.");
        }
        if (requestCount > maxRequests) {
            throw new ApiException(
                    "RATE_LIMITED",
                    "Too many authentication attempts. Please try again later.",
                    HttpStatus.TOO_MANY_REQUESTS);
        }
    }
}
