package com.kalasathi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kalasathi.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
public class ImageEnhancementQueue {
    private static final Logger logger = LoggerFactory.getLogger(ImageEnhancementQueue.class);
    private static final String QUEUE_KEY = "kalasathi:jobs:image-enhancement";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public ImageEnhancementQueue(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public String enqueue(String productId, String mediaId, String objectKey) {
        ImageEnhancementJob job = new ImageEnhancementJob(
                UUID.randomUUID().toString(), productId, mediaId, objectKey, 0);
        publish(job);
        return job.jobId();
    }

    public Optional<ImageEnhancementJob> poll(Duration timeout) {
        String payload = redisTemplate.opsForList().leftPop(QUEUE_KEY, timeout);
        if (payload == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readValue(payload, ImageEnhancementJob.class));
        } catch (JsonProcessingException exception) {
            logger.error("Discarding an invalid image enhancement job payload.", exception);
            throw new IllegalStateException("An invalid image enhancement job was found in Redis.", exception);
        }
    }

    public void retry(ImageEnhancementJob job) {
        publish(job.nextAttempt());
    }

    private void publish(ImageEnhancementJob job) {
        final String payload;
        try {
            payload = objectMapper.writeValueAsString(job);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Image enhancement job could not be serialized.", exception);
        }
        try {
            Long queueLength = redisTemplate.opsForList().rightPush(QUEUE_KEY, payload);
            if (queueLength == null) {
                throw new IllegalStateException("Image enhancement job could not be queued.");
            }
        } catch (RedisConnectionFailureException exception) {
            logger.error("Redis is unavailable while queuing image enhancement.", exception);
            throw new ApiException(
                    "SERVICE_UNAVAILABLE",
                    "Image processing is temporarily unavailable. Please try again later.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
}
