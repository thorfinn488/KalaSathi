package com.kalasathi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kalasathi.dto.ProductDtos.ProductResponse;
import com.kalasathi.entity.ProductEntity;
import com.kalasathi.entity.UserEntity;
import com.kalasathi.repository.OpportunityRepository;
import com.kalasathi.repository.ProductMediaRepository;
import com.kalasathi.repository.ProductRepository;
import com.kalasathi.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.List;
import java.util.Optional;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringJUnitConfig(ProductServiceCacheTest.Config.class)
class ProductServiceCacheTest {
    @Autowired
    private ProductService productService;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductMediaRepository productMediaRepository;
    @Autowired
    private OpportunityRepository opportunityRepository;

    @Test
    void productListCacheIsReusedAndEvictedAfterProductCreation() {
        AtomicReference<ProductEntity> createdProduct = new AtomicReference<>();
        UserEntity artisan = new UserEntity(
                "usr_test", "Test Artisan", "9811122233", "hash", UserEntity.Role.ARTISAN);
        when(userRepository.findById("usr_test")).thenReturn(Optional.of(artisan));
        when(productRepository.save(org.mockito.ArgumentMatchers.any(ProductEntity.class)))
                .thenAnswer(invocation -> {
                    ProductEntity product = invocation.getArgument(0);
                    product.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
                    createdProduct.set(product);
                    return product;
                });
        when(productRepository.findAllByOrderByCreatedAtDesc()).thenAnswer(invocation -> {
            ProductEntity product = createdProduct.get();
            return product == null ? List.of() : List.of(product);
        });
        when(productMediaRepository.findAllByProduct_IdOrderByCreatedAtAsc(
                org.mockito.ArgumentMatchers.anyString())).thenReturn(List.of());
        when(opportunityRepository.findAllByProduct_IdOrderByCreatedAtDesc(
                org.mockito.ArgumentMatchers.anyString())).thenReturn(List.of());

        assertEquals(0, productService.list().size());
        productService.list();
        verify(productRepository, times(1)).findAllByOrderByCreatedAtDesc();

        productService.createDraft("usr_test", false, null);
        List<ProductResponse> refreshed = productService.list();

        assertEquals(createdProduct.get().getId(), refreshed.get(0).product_id());
        verify(productRepository, times(2)).findAllByOrderByCreatedAtDesc();
    }

    @Configuration
    @EnableCaching
    static class Config {
        @Bean
        CacheManager cacheManager() {
            return new ConcurrentMapCacheManager();
        }

        @Bean
        ProductRepository productRepository() {
            return mock(ProductRepository.class);
        }

        @Bean
        UserRepository userRepository() {
            return mock(UserRepository.class);
        }

        @Bean
        ProductMediaRepository productMediaRepository() {
            return mock(ProductMediaRepository.class);
        }

        @Bean
        OpportunityRepository opportunityRepository() {
            return mock(OpportunityRepository.class);
        }

        @Bean
        MediaContentValidator mediaContentValidator() {
            return mock(MediaContentValidator.class);
        }

        @Bean
        S3MediaStorageService mediaStorageService() {
            return mock(S3MediaStorageService.class);
        }

        @Bean
        ImageEnhancementQueue imageEnhancementQueue() {
            return mock(ImageEnhancementQueue.class);
        }

        @Bean
        CacheInvalidationService cacheInvalidationService(CacheManager cacheManager) {
            return new CacheInvalidationService(cacheManager);
        }

        @Bean
        ProductService productService(
                ProductRepository productRepository,
                UserRepository userRepository,
                ProductMediaRepository productMediaRepository,
                OpportunityRepository opportunityRepository,
                MediaContentValidator mediaContentValidator,
                S3MediaStorageService mediaStorageService,
                ImageEnhancementQueue imageEnhancementQueue,
                CacheInvalidationService cacheInvalidationService) {
            return new ProductService(
                    productRepository,
                    userRepository,
                    productMediaRepository,
                    opportunityRepository,
                    new ObjectMapper(),
                    mediaContentValidator,
                    mediaStorageService,
                    imageEnhancementQueue,
                    cacheInvalidationService);
        }
    }
}
