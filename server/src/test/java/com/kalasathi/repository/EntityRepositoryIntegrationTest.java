package com.kalasathi.repository;

import com.kalasathi.entity.OpportunityEntity;
import com.kalasathi.entity.OrderEntity;
import com.kalasathi.entity.ProductEntity;
import com.kalasathi.entity.ProductMediaEntity;
import com.kalasathi.entity.UserEntity;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

@DataJpaTest(properties = "app.security.jwt-secret=repository-test-secret-0123456789")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class EntityRepositoryIntegrationTest {
    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OpportunityRepository opportunityRepository;

    @Autowired
    private ProductMediaRepository productMediaRepository;

    @Test
    void savesAndReadsOneRowForEveryEntity() {
        UserEntity user = userRepository.saveAndFlush(
                new UserEntity("usr_test", "Test Artisan", "9811122233", "password-hash", UserEntity.Role.ARTISAN));
        UserEntity savedUser = userRepository.findById(user.getId()).orElseThrow();
        assertEquals(user.getId(), savedUser.getId());
        assertNotNull(savedUser.getCreatedAt());
        assertNotNull(savedUser.getUpdatedAt());

        ProductEntity product = productRepository.saveAndFlush(
                new ProductEntity("prod_test", savedUser, "Test Artisan", ProductEntity.Status.READY));
        ProductEntity savedProduct = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(product.getId(), savedProduct.getId());
        assertNotNull(savedProduct.getCreatedAt());
        assertNotNull(savedProduct.getUpdatedAt());

        ProductMediaEntity media = productMediaRepository.saveAndFlush(
                new ProductMediaEntity(
                        "media_test",
                        savedProduct,
                        ProductMediaEntity.MediaType.IMAGE,
                        "https://example.test/image.jpg",
                        "image/jpeg"));
        ProductMediaEntity savedMedia = productMediaRepository.findById(media.getId()).orElseThrow();
        assertEquals(media.getId(), savedMedia.getId());
        assertNotNull(savedMedia.getCreatedAt());
        assertNotNull(savedMedia.getUpdatedAt());

        OrderEntity order = orderRepository.saveAndFlush(
                new OrderEntity(
                        "order_test",
                        null,
                        "Test Product",
                        "Test Artisan",
                        "Test Customer",
                        "9899988877",
                        "1 Test Street",
                        1,
                        new BigDecimal("25.00"),
                        new BigDecimal("25.00")));
        OrderEntity savedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(order.getId(), savedOrder.getId());
        assertNull(savedOrder.getProduct());
        assertNotNull(savedOrder.getCreatedAt());
        assertNotNull(savedOrder.getUpdatedAt());

        OpportunityEntity opportunity = opportunityRepository.saveAndFlush(
                new OpportunityEntity("opp_test", savedProduct, "Test Buyer", "Test requirement"));
        OpportunityEntity savedOpportunity = opportunityRepository.findById(opportunity.getId()).orElseThrow();
        assertEquals(opportunity.getId(), savedOpportunity.getId());
        assertNotNull(savedOpportunity.getCreatedAt());
        assertNotNull(savedOpportunity.getUpdatedAt());
    }
}
