package com.kalasathi.service;

public record ImageEnhancementJob(
        String jobId, String productId, String mediaId, String objectKey, int retryAttempt) {
    public ImageEnhancementJob nextAttempt() {
        return new ImageEnhancementJob(jobId, productId, mediaId, objectKey, retryAttempt + 1);
    }
}
