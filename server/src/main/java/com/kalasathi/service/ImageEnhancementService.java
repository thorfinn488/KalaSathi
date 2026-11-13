package com.kalasathi.service;

import com.kalasathi.entity.ProductEntity;
import com.kalasathi.entity.ProductMediaEntity;
import com.kalasathi.repository.ProductMediaRepository;
import com.kalasathi.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Service
public class ImageEnhancementService {
    private static final Logger logger = LoggerFactory.getLogger(ImageEnhancementService.class);
    private static final int MAX_OUTPUT_SIZE_BYTES = 25 * 1024 * 1024;
    private static final String ACCEPTED_OUTPUT_TYPES = "image/jpeg, image/png, image/webp";

    private final ProductRepository productRepository;
    private final ProductMediaRepository mediaRepository;
    private final S3MediaStorageService storageService;
    private final HttpClient httpClient;
    private final String enhancementUrl;
    private final String enhancementApiKey;
    private final CacheInvalidationService cacheInvalidationService;

    public ImageEnhancementService(
            ProductRepository productRepository,
            ProductMediaRepository mediaRepository,
            S3MediaStorageService storageService,
            HttpClient httpClient,
            @Value("${app.image-enhancement.url}") String enhancementUrl,
            @Value("${app.image-enhancement.api-key}") String enhancementApiKey,
            CacheInvalidationService cacheInvalidationService) {
        this.productRepository = productRepository;
        this.mediaRepository = mediaRepository;
        this.storageService = storageService;
        this.httpClient = httpClient;
        this.enhancementUrl = enhancementUrl;
        this.enhancementApiKey = enhancementApiKey;
        this.cacheInvalidationService = cacheInvalidationService;
    }

    public void process(ImageEnhancementJob job) {
        try {
            ProductEntity product = findProduct(job.productId());
            product.setProcessingStep("enhancing_image");
            product.setProcessingProgress(30);
            product.setProcessingError(null);
            productRepository.save(product);
            cacheInvalidationService.productChanged(job.productId());

            S3MediaStorageService.StoredObject source = storageService.readObject(job.objectKey());
            EnhancedImage enhanced = requestEnhancedImage(source);
            String mediaId = UUID.randomUUID().toString();
            String objectKey = "products/" + job.productId() + "/enhanced/" + mediaId + "."
                    + extension(enhanced.contentType());
            storageService.putObject(objectKey, enhanced.content(), enhanced.contentType(), Map.of(
                    "source-media-id", job.mediaId(),
                    "source-content-type", source.contentType()));

            ProductMediaEntity media = new ProductMediaEntity(
                    mediaId, product, ProductMediaEntity.MediaType.IMAGE, null, enhanced.contentType());
            media.setObjectKey(objectKey);
            try {
                mediaRepository.save(media);
            } catch (RuntimeException exception) {
                deleteEnhancedObject(objectKey, exception);
                throw exception;
            }

            product.setImageUrl("/media/" + mediaId);
            product.setStatus(ProductEntity.Status.READY);
            product.setProcessingStep("done");
            product.setProcessingProgress(100);
            product.setProcessingError(null);
            productRepository.save(product);
            cacheInvalidationService.productChanged(job.productId());
        } catch (RuntimeException exception) {
            markFailed(job.productId(), exception);
            throw exception;
        }
    }

    private EnhancedImage requestEnhancedImage(S3MediaStorageService.StoredObject source) {
        if (enhancementUrl.isBlank()) {
            throw new IllegalStateException("IMAGE_ENHANCEMENT_URL is not configured.");
        }
        RuntimeException lastFailure = null;
        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                HttpRequest.Builder requestBuilder = HttpRequest.newBuilder(URI.create(enhancementUrl))
                        .timeout(Duration.ofSeconds(60))
                        .header("Content-Type", source.contentType())
                        .header("Accept", ACCEPTED_OUTPUT_TYPES)
                        .POST(HttpRequest.BodyPublishers.ofByteArray(source.content()));
                if (!enhancementApiKey.isBlank()) {
                    requestBuilder.header("Authorization", "Bearer " + enhancementApiKey);
                }
                HttpResponse<InputStream> response = httpClient.send(
                        requestBuilder.build(), HttpResponse.BodyHandlers.ofInputStream());
                try (InputStream body = response.body()) {
                    if (response.statusCode() < 200 || response.statusCode() >= 300) {
                        throw new IllegalStateException(
                                "Image enhancement provider returned HTTP " + response.statusCode() + ".");
                    }
                    String contentType = response.headers().firstValue("Content-Type")
                            .orElse("")
                            .split(";", 2)[0]
                            .trim()
                            .toLowerCase();
                    if (!isSupportedOutputType(contentType)) {
                        throw new IllegalStateException(
                                "Image enhancement provider returned an unsupported content type.");
                    }
                    byte[] content = body.readNBytes(MAX_OUTPUT_SIZE_BYTES + 1);
                    if (content.length == 0 || content.length > MAX_OUTPUT_SIZE_BYTES) {
                        throw new IllegalStateException(
                                "Image enhancement provider returned an empty or oversized image.");
                    }
                    return new EnhancedImage(content, contentType);
                }
            } catch (IOException exception) {
                lastFailure = new IllegalStateException("Image enhancement request failed.", exception);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Image enhancement request was interrupted.", exception);
            } catch (RuntimeException exception) {
                lastFailure = exception;
            }
            if (attempt < 2) {
                pauseBeforeProviderRetry(attempt);
            }
        }
        throw new IllegalStateException("Image enhancement failed after three attempts.", lastFailure);
    }

    private void markFailed(String productId, RuntimeException originalFailure) {
        try {
            ProductEntity product = findProduct(productId);
            String message = originalFailure.getMessage();
            product.setStatus(ProductEntity.Status.FAILED);
            product.setProcessingStep("failed");
            product.setProcessingProgress(0);
            product.setProcessingError(message == null
                    ? "Image enhancement failed."
                    : message.substring(0, Math.min(message.length(), 1000)));
            productRepository.save(product);
            cacheInvalidationService.productChanged(productId);
        } catch (RuntimeException statusFailure) {
            originalFailure.addSuppressed(statusFailure);
            logger.error("Could not save failed image processing status for product {}.", productId, statusFailure);
        }
    }

    private void deleteEnhancedObject(String objectKey, RuntimeException originalFailure) {
        try {
            storageService.deleteObject(objectKey);
        } catch (RuntimeException cleanupFailure) {
            originalFailure.addSuppressed(cleanupFailure);
            logger.error("Could not remove an enhanced image after a database failure.", cleanupFailure);
        }
    }

    private ProductEntity findProduct(String productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new IllegalStateException("Image processing product no longer exists."));
    }

    private static boolean isSupportedOutputType(String contentType) {
        return contentType.equals("image/jpeg")
                || contentType.equals("image/png")
                || contentType.equals("image/webp");
    }

    private static String extension(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> throw new IllegalArgumentException("Unsupported enhanced image type.");
        };
    }

    private static void pauseBeforeProviderRetry(int attempt) {
        try {
            Thread.sleep(1000L * (attempt + 1));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Image enhancement retry was interrupted.", exception);
        }
    }

    private record EnhancedImage(byte[] content, String contentType) {
    }
}
