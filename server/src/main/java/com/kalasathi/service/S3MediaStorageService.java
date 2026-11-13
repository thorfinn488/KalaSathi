package com.kalasathi.service;

import com.kalasathi.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.ServerSideEncryption;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

@Service
public class S3MediaStorageService {
    private static final Logger logger = LoggerFactory.getLogger(S3MediaStorageService.class);
    private static final String STORAGE_UNAVAILABLE_MESSAGE =
            "Product media storage is temporarily unavailable.";

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucket;

    public S3MediaStorageService(
            S3Client s3Client,
            S3Presigner s3Presigner,
            @Value("${app.storage.s3.bucket}") String bucket) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.bucket = bucket;
    }

    public boolean isConfigured() {
        return !bucket.isBlank();
    }

    public void putObject(String objectKey, byte[] content, String contentType, Map<String, String> metadata) {
        requireBucket();
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .contentType(contentType)
                .serverSideEncryption(ServerSideEncryption.AES256)
                .metadata(metadata == null ? Map.of() : metadata)
                .build();
        try {
            s3Client.putObject(request, RequestBody.fromBytes(content));
        } catch (SdkException exception) {
            logger.error("S3 media upload failed.", exception);
            throw storageUnavailable();
        }
    }

    public void deleteObject(String objectKey) {
        requireBucket();
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(objectKey).build());
        } catch (SdkException exception) {
            logger.error("S3 media cleanup failed.", exception);
            throw storageUnavailable();
        }
    }

    public String createDownloadUrl(String objectKey) {
        requireBucket();
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey)
                    .build();
            return s3Presigner.presignGetObject(GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(300))
                    .getObjectRequest(getObjectRequest)
                    .build()).url().toString();
        } catch (SdkException exception) {
            logger.error("S3 media URL signing failed.", exception);
            throw storageUnavailable();
        }
    }

    public StoredObject readObject(String objectKey) {
        requireBucket();
        try (var response = s3Client.getObject(GetObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .build())) {
            return new StoredObject(response.readAllBytes(),
                    response.response().contentType() == null
                            ? "application/octet-stream" : response.response().contentType());
        } catch (SdkException | IOException exception) {
            logger.error("S3 media read failed.", exception);
            throw new IllegalStateException("The source image could not be read from media storage.", exception);
        }
    }

    private void requireBucket() {
        if (!isConfigured()) {
            throw storageUnavailable();
        }
    }

    private static ApiException storageUnavailable() {
        return new ApiException("SERVICE_UNAVAILABLE", STORAGE_UNAVAILABLE_MESSAGE, HttpStatus.SERVICE_UNAVAILABLE);
    }

    public record StoredObject(byte[] content, String contentType) {
    }
}
