package com.kalasathi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.kalasathi.dto.OpportunityDtos.OpportunityCreatedResponse;
import com.kalasathi.dto.OpportunityDtos.OpportunityListItem;
import com.kalasathi.dto.OpportunityDtos.OpportunityRequest;
import com.kalasathi.entity.OpportunityEntity;
import com.kalasathi.entity.ProductEntity;
import com.kalasathi.exception.ApiException;
import com.kalasathi.repository.OpportunityRepository;
import com.kalasathi.repository.ProductRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class OpportunityService {
    private static final String DEFAULT_COMPANY = "Retail / Enterprise Partner";
    private final OpportunityRepository opportunityRepository;
    private final ProductRepository productRepository;
    private final CacheInvalidationService cacheInvalidationService;

    public OpportunityService(
            OpportunityRepository opportunityRepository,
            ProductRepository productRepository,
            CacheInvalidationService cacheInvalidationService) {
        this.opportunityRepository = opportunityRepository;
        this.productRepository = productRepository;
        this.cacheInvalidationService = cacheInvalidationService;
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheInvalidationService.OPPORTUNITIES, key = "'all'")
    public List<OpportunityListItem> list() {
        return opportunityRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toListItem).toList();
    }

    @Transactional
    public OpportunityCreatedResponse create(OpportunityRequest request) {
        ProductEntity product = productRepository.findById(request.product_id())
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Product not found.", HttpStatus.NOT_FOUND));
        int moq = product.getMoq() == null ? 1 : product.getMoq();
        if (request.quantity() < moq) {
            throw new ApiException("MOQ_NOT_MET",
                    "Requested quantity is below the minimum order quantity of " + moq + " units.",
                    HttpStatus.BAD_REQUEST);
        }

        JsonNode productPricing = product.getPricing();
        JsonNode productPrice = product.getPrice();
        double basePrice = positiveNumber(productPricing, "suggested_price");
        if (basePrice == 0) {
            basePrice = positiveNumber(productPrice, "suggested_price");
        }
        if (basePrice == 0) {
            throw new ApiException("PRODUCT_UNPRICED",
                    "This product has no valid published price yet.", HttpStatus.CONFLICT);
        }
        validatePackaging(request.packaging());
        int leadTime = product.getLeadTimeDays() == null ? 14 : product.getLeadTimeDays();
        int discount = request.quantity() >= 200 ? 18 : request.quantity() >= 50 ? 10 : 0;
        int packagingSurcharge = "Laser-Engraved Corporate Wooden Box".equals(request.packaging()) ? 120 : 0;
        double unitPrice = Math.round(basePrice * (1 - discount / 100.0)) + packagingSurcharge;
        double total = unitPrice * request.quantity();
        int estimatedLeadDays = Math.max(leadTime, (int) Math.ceil(request.quantity() / 4.0));

        String requirement = String.join(" · ",
                List.of(request.requirement(),
                        request.packaging() == null || request.packaging().isBlank() ? "" : "Packaging: " + request.packaging(),
                        "Quantity: " + request.quantity() + " units",
                        "Estimated production: " + estimatedLeadDays + " days")
                        .stream().filter(value -> !value.isBlank()).toList());
        OpportunityEntity opportunity = new OpportunityEntity(
                "opp_" + UUID.randomUUID(), product, request.buyer_name(), requirement);
        opportunity.setBuyerContact(request.contact_info());
        opportunity.setCompanyName(request.company_name() == null || request.company_name().isBlank()
                ? DEFAULT_COMPANY : request.company_name());
        opportunity.setMatchScore(90);
        opportunity.setStatus("ACTIVE");
        opportunity.setQuantity(request.quantity());
        opportunity.setBudget(request.budget());
        OpportunityEntity saved = opportunityRepository.save(opportunity);
        cacheInvalidationService.opportunityChanged(product.getId());
        return OpportunityCreatedResponse.from(saved, product.getId(), moq, discount, unitPrice, total, estimatedLeadDays);
    }

    private OpportunityListItem toListItem(OpportunityEntity entity) {
        return new OpportunityListItem(
                entity.getId(),
                entity.getProduct() == null ? "" : entity.getProduct().getId(),
                entity.getBuyerName(),
                entity.getCompanyName() == null ? "" : entity.getCompanyName(),
                entity.getMatchScore(),
                entity.getStatus(),
                entity.getRequirement());
    }

    private static double positiveNumber(JsonNode node, String field) {
        if (node == null || !node.path(field).isNumber()) {
            return 0;
        }
        double value = node.path(field).asDouble();
        return Double.isFinite(value) && value > 0 ? value : 0;
    }

    private static void validatePackaging(String packaging) {
        if (packaging != null && !packaging.isBlank()
                && !List.of("Sustainable Jute Keepsake Bag", "Eco-Friendly Kraft Gift Box",
                "Laser-Engraved Corporate Wooden Box").contains(packaging)) {
            throw new ApiException("VALIDATION_ERROR", "Invalid quotation request.", HttpStatus.BAD_REQUEST);
        }
    }
}
