package com.kalasathi.service;

import com.kalasathi.entity.ProductEntity;
import com.kalasathi.entity.ProductMediaEntity;
import com.kalasathi.repository.ProductMediaRepository;
import com.kalasathi.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ImageEnhancementServiceTest {
    @Test
    @SuppressWarnings("unchecked")
    void successfulEnhancementStoresImageAndUpdatesProductStatus() throws Exception {
        ProductRepository products = mock(ProductRepository.class);
        ProductMediaRepository media = mock(ProductMediaRepository.class);
        S3MediaStorageService storage = mock(S3MediaStorageService.class);
        HttpClient httpClient = mock(HttpClient.class);
        ProductEntity product = new ProductEntity("prod_test", null, null, ProductEntity.Status.PROCESSING);
        HttpResponse<InputStream> response = mock(HttpResponse.class);
        byte[] enhancedBytes = {(byte) 0x89, 'P', 'N', 'G'};
        ImageEnhancementService service = new ImageEnhancementService(
                products, media, storage, httpClient, "https://images.example.test/enhance", "test-api-key",
                mock(CacheInvalidationService.class));
        ImageEnhancementJob job = new ImageEnhancementJob(
                "job_test", "prod_test", "source_media", "products/prod_test/image/source.jpeg", 0);

        when(products.findById("prod_test")).thenReturn(Optional.of(product));
        when(storage.readObject(job.objectKey())).thenReturn(
                new S3MediaStorageService.StoredObject(new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
                        "image/jpeg"));
        when(response.statusCode()).thenReturn(200);
        when(response.headers()).thenReturn(HttpHeaders.of(
                Map.of("Content-Type", List.of("image/png; charset=binary")), (name, value) -> true));
        when(response.body()).thenReturn(new ByteArrayInputStream(enhancedBytes));
        doReturn(response).when(httpClient).send(any(), any(HttpResponse.BodyHandler.class));

        service.process(job);

        assertEquals(ProductEntity.Status.READY, product.getStatus());
        assertEquals("done", product.getProcessingStep());
        assertEquals(100, product.getProcessingProgress());
        assertEquals("/media/" + product.getImageUrl().substring("/media/".length()), product.getImageUrl());
        verify(storage).putObject(
                eq("products/prod_test/enhanced/" + product.getImageUrl().substring("/media/".length()) + ".png"),
                eq(enhancedBytes),
                eq("image/png"),
                any());
        verify(media).save(any(ProductMediaEntity.class));
    }

    @Test
    void missingProviderMarksProductFailed() {
        ProductRepository products = mock(ProductRepository.class);
        ProductMediaRepository media = mock(ProductMediaRepository.class);
        S3MediaStorageService storage = mock(S3MediaStorageService.class);
        HttpClient httpClient = mock(HttpClient.class);
        ProductEntity product = new ProductEntity("prod_test", null, null, ProductEntity.Status.PROCESSING);
        ImageEnhancementService service = new ImageEnhancementService(
                products, media, storage, httpClient, "", "", mock(CacheInvalidationService.class));

        when(products.findById("prod_test")).thenReturn(Optional.of(product));
        when(storage.readObject("source-key")).thenReturn(
                new S3MediaStorageService.StoredObject(new byte[] {1}, "image/jpeg"));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> service.process(
                new ImageEnhancementJob("job_test", "prod_test", "media_test", "source-key", 0)));

        assertEquals("IMAGE_ENHANCEMENT_URL is not configured.", exception.getMessage());
        assertEquals(ProductEntity.Status.FAILED, product.getStatus());
        assertEquals("failed", product.getProcessingStep());
        assertEquals(0, product.getProcessingProgress());
        assertEquals("IMAGE_ENHANCEMENT_URL is not configured.", product.getProcessingError());
    }
}
