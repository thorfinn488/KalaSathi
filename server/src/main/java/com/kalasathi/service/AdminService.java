package com.kalasathi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.kalasathi.dto.AdminDtos.Artisan;
import com.kalasathi.dto.AdminDtos.Product;
import com.kalasathi.dto.AdminDtos.Opportunity;
import com.kalasathi.entity.OpportunityEntity;
import com.kalasathi.entity.ProductEntity;
import com.kalasathi.entity.UserEntity;
import com.kalasathi.repository.OpportunityRepository;
import com.kalasathi.repository.ProductRepository;
import com.kalasathi.repository.UserRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OpportunityRepository opportunityRepository;

    public AdminService(
            UserRepository userRepository,
            ProductRepository productRepository,
            OpportunityRepository opportunityRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.opportunityRepository = opportunityRepository;
    }

    @Transactional(readOnly = true)
    public List<Artisan> artisans() {
        return userRepository.findAllByRoleOrderByCreatedAtDesc(UserEntity.Role.ARTISAN).stream()
                .map(user -> new Artisan(
                        user.getId(), user.getId(), user.getName(), user.getPhone(),
                        user.getRegion() == null ? "India" : user.getRegion(),
                        user.getCraftSpecialty() == null ? "Traditional Artisan Craft" : user.getCraftSpecialty(),
                        user.getCreatedAt().toString()))
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheInvalidationService.ADMIN_PRODUCTS, key = "'all'")
    public List<Product> products() {
        return productRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toProduct).toList();
    }

    @Transactional(readOnly = true)
    public List<Opportunity> opportunities() {
        return opportunityRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toOpportunity)
                .toList();
    }

    private Product toProduct(ProductEntity entity) {
        String artisanName = entity.getArtisan() == null ? "N/A" : entity.getArtisan().getName();
        if (entity.getArtisanName() != null) {
            artisanName = entity.getArtisanName();
        }
        JsonNode catalogue = entity.getCatalogue();
        JsonNode pricing = entity.getPricing();
        return new Product(
                entity.getId(),
                entity.getArtisan() == null ? null : entity.getArtisan().getId(),
                artisanName,
                entity.getStatus().name(),
                entity.getCreatedAt().toString(),
                catalogue == null || catalogue.path("name").isMissingNode() ? null : catalogue.path("name").asText(),
                pricing == null || !pricing.path("suggested_price").isNumber()
                        ? null : pricing.path("suggested_price").asDouble());
    }

    private Opportunity toOpportunity(OpportunityEntity entity) {
        return new Opportunity(
                entity.getId(),
                entity.getProduct() == null ? "" : entity.getProduct().getId(),
                entity.getBuyerName(), entity.getBuyerContact(),
                entity.getCompanyName() == null ? "" : entity.getCompanyName(),
                entity.getMatchScore(), entity.getStatus(), entity.getRequirement(),
                entity.getQuantity(), entity.getBudget(), entity.getCreatedAt().toString());
    }
}
