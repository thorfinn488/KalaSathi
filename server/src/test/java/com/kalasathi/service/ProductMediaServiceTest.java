package com.kalasathi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kalasathi.dto.ProductDtos.ProcessRequest;
import com.kalasathi.entity.ProductEntity;
import com.kalasathi.entity.ProductMediaEntity;
import com.kalasathi.entity.UserEntity;
import com.kalasathi.exception.ApiException;
import com.kalasathi.repository.OpportunityRepository;
import com.kalasathi.repository.ProductMediaRepository;
import com.kalasathi.repository.ProductRepository;
import com.kalasathi.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductMediaServiceTest {
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductMediaRepository mediaRepository;
    @Mock
    private OpportunityRepository opportunityRepository;
    @Mock
    private MediaContentValidator mediaContentValidator;
    @Mock
    private S3MediaStorageService mediaStorageService;
    @Mock
    private ImageEnhancementQueue imageEnhancementQueue;
    @Mock
    private CacheInvalidationService cacheInvalidationService;

    private ProductService productService;
    private ProductEntity product;

    @BeforeEach
    void setUp() {
        productService = new ProductService(
                productRepository,
                userRepository,
                mediaRepository,
                opportunityRepository,
                new ObjectMapper(),
                mediaContentValidator,
                mediaStorageService,
                imageEnhancementQueue,
                cacheInvalidationService);
        UserEntity artisan = new UserEntity(
                "usr_test", "Test Artisan", "9811122233", "hash", UserEntity.Role.ARTISAN);
        product = new ProductEntity("prod_test", artisan, "Test Artisan", ProductEntity.Status.DRAFT);
        when(productRepository.findById("prod_test")).thenReturn(Optional.of(product));
    }

    @Test
    void imageUploadStoresObjectAndReturnsExpressShape() {
        byte[] content = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
        MockMultipartFile file = new MockMultipartFile("file", "image.jpg", "image/jpeg", content);
        when(mediaStorageService.isConfigured()).thenReturn(true);
        when(mediaContentValidator.validateImage(file)).thenReturn(
                new MediaContentValidator.ValidatedMedia(content, "image/jpeg", "jpeg"));
        when(mediaRepository.saveAndFlush(any(ProductMediaEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(productRepository.saveAndFlush(product)).thenReturn(product);

        var response = productService.uploadImage("prod_test", "usr_test", false, file);

        assertEquals("prod_test", response.product_id());
        assertEquals("/media/" + response.image_url().substring("/media/".length()), response.image_url());
        assertEquals(response.image_url(), product.getImageUrl());
        verify(mediaStorageService).putObject(
                eq("products/prod_test/image/" + response.image_url().substring("/media/".length()) + ".jpeg"),
                eq(content),
                eq("image/jpeg"),
                anyMap());
        ArgumentCaptor<ProductMediaEntity> mediaCaptor = ArgumentCaptor.forClass(ProductMediaEntity.class);
        verify(mediaRepository).saveAndFlush(mediaCaptor.capture());
        assertEquals(response.image_url().substring("/media/".length()), mediaCaptor.getValue().getId());
        assertEquals(ProductMediaEntity.MediaType.IMAGE, mediaCaptor.getValue().getMediaType());
        assertEquals("image/jpeg", mediaCaptor.getValue().getContentType());
    }

    @Test
    void processingRequestPersistsQueuedStatusAndReturnsJobId() {
        ProductMediaEntity image = new ProductMediaEntity(
                "media_test", product, ProductMediaEntity.MediaType.IMAGE, null, "image/jpeg");
        image.setObjectKey("products/prod_test/image/media_test.jpeg");
        when(mediaRepository
                .findFirstByProduct_IdAndMediaTypeAndObjectKeyIsNotNullOrderByCreatedAtDesc(
                        "prod_test", ProductMediaEntity.MediaType.IMAGE))
                .thenReturn(Optional.of(image));
        when(productRepository.saveAndFlush(product)).thenReturn(product);
        when(imageEnhancementQueue.enqueue("prod_test", "media_test", image.getObjectKey())).thenReturn("job_test");

        var response = productService.process(
                "prod_test", "usr_test", false, new ProcessRequest("Handwoven in Kutch"));

        assertEquals("job_test", response.job_id());
        assertEquals("PROCESSING", response.status());
        assertEquals(ProductEntity.Status.PROCESSING, product.getStatus());
        assertEquals("queued_for_image_enhancement", product.getProcessingStep());
        assertEquals(5, product.getProcessingProgress());
        assertEquals("Handwoven in Kutch", product.getHeritageStory());
    }

    @Test
    void queueFailureLeavesProductMarkedFailed() {
        ProductMediaEntity image = new ProductMediaEntity(
                "media_test", product, ProductMediaEntity.MediaType.IMAGE, null, "image/jpeg");
        image.setObjectKey("products/prod_test/image/media_test.jpeg");
        when(mediaRepository
                .findFirstByProduct_IdAndMediaTypeAndObjectKeyIsNotNullOrderByCreatedAtDesc(
                        "prod_test", ProductMediaEntity.MediaType.IMAGE))
                .thenReturn(Optional.of(image));
        when(productRepository.saveAndFlush(product)).thenReturn(product);
        when(imageEnhancementQueue.enqueue("prod_test", "media_test", image.getObjectKey()))
                .thenThrow(new ApiException(
                        "SERVICE_UNAVAILABLE", "Image processing is unavailable.", HttpStatus.SERVICE_UNAVAILABLE));

        ApiException exception = assertThrows(ApiException.class, () -> productService.process(
                "prod_test", "usr_test", false, new ProcessRequest(null)));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
        assertEquals(ProductEntity.Status.FAILED, product.getStatus());
        assertEquals("failed", product.getProcessingStep());
        assertEquals("Image processing is unavailable.", product.getProcessingError());
    }
}
