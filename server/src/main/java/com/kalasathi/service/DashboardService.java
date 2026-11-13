package com.kalasathi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.kalasathi.dto.DashboardDtos.CategoryTrend;
import com.kalasathi.dto.DashboardDtos.CatalogueStatusCounts;
import com.kalasathi.dto.DashboardDtos.Insight;
import com.kalasathi.dto.DashboardDtos.Insights;
import com.kalasathi.dto.DashboardDtos.MonthlyActivity;
import com.kalasathi.dto.DashboardDtos.Summary;
import com.kalasathi.dto.DashboardDtos.Trends;
import com.kalasathi.dto.ProductDtos.ProductResponse;
import com.kalasathi.entity.OpportunityEntity;
import com.kalasathi.entity.ProductEntity;
import com.kalasathi.entity.UserEntity;
import com.kalasathi.exception.ApiException;
import com.kalasathi.repository.OpportunityRepository;
import com.kalasathi.repository.ProductRepository;
import com.kalasathi.repository.UserRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class DashboardService {
    private final ProductRepository productRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    public DashboardService(
            ProductRepository productRepository,
            OpportunityRepository opportunityRepository,
            UserRepository userRepository,
            ProductService productService) {
        this.productRepository = productRepository;
        this.opportunityRepository = opportunityRepository;
        this.userRepository = userRepository;
        this.productService = productService;
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheInvalidationService.DASHBOARD_SUMMARY, key = "#userId")
    public Summary summary(String userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User session not found", HttpStatus.UNAUTHORIZED));
        List<ProductEntity> rows = user.getRole() == UserEntity.Role.ARTISAN
                ? productRepository.findAllByArtisan_IdOrderByCreatedAtDesc(userId)
                : productRepository.findAllByOrderByCreatedAtDesc();
        List<ProductResponse> allProducts = productService.list();
        if (user.getRole() == UserEntity.Role.ARTISAN) {
            allProducts = allProducts.stream().filter(product -> product.artisan_id().equals(userId)).toList();
        }
        List<ProductResponse> recent = allProducts.stream().limit(5).toList();

        int ready = 0;
        int processing = 0;
        int draft = 0;
        Map<YearMonth, Integer> activities = new HashMap<>();
        Map<String, CategoryAccumulator> categories = new HashMap<>();
        List<Double> prices = new ArrayList<>();
        for (ProductEntity product : rows) {
            switch (product.getStatus()) {
                case READY, PUBLISHED -> ready++;
                case PROCESSING -> processing++;
                case DRAFT -> draft++;
                default -> { }
            }
            YearMonth month = YearMonth.from(product.getCreatedAt().atZone(ZoneOffset.UTC));
            activities.merge(month, 1, Integer::sum);
            Double price = number(product.getPricing(), "suggested_price");
            if (price != null) {
                prices.add(price);
            }
            String categoryName = text(product.getCatalogue(), "category");
            if (categoryName != null) {
                CategoryAccumulator category = categories.computeIfAbsent(categoryName, ignored -> new CategoryAccumulator());
                category.products++;
                if (price != null) {
                    category.prices.add(price);
                }
            }
        }

        List<MonthlyActivity> monthly = new ArrayList<>();
        YearMonth currentMonth = YearMonth.now(ZoneOffset.UTC);
        for (int offset = 5; offset >= 0; offset--) {
            YearMonth month = currentMonth.minusMonths(offset);
            monthly.add(new MonthlyActivity(
                    month.getMonth().getDisplayName(TextStyle.SHORT, Locale.US),
                    activities.getOrDefault(month, 0)));
        }

        List<CategoryTrend> categoryTrends = categories.entrySet().stream()
                .map(entry -> new CategoryTrend(
                        entry.getKey(), entry.getValue().products, average(entry.getValue().prices)))
                .sorted(Comparator.comparingInt(CategoryTrend::products).reversed().thenComparing(CategoryTrend::name))
                .toList();

        List<OpportunityEntity> opportunities = opportunityRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(opportunity -> user.getRole() != UserEntity.Role.ARTISAN
                        || opportunity.getProduct() != null
                        && opportunity.getProduct().getArtisan() != null
                        && userId.equals(opportunity.getProduct().getArtisan().getId()))
                .toList();
        List<Double> matchScores = opportunities.stream().map(item -> (double) item.getMatchScore()).toList();

        return new Summary(
                rows.size(),
                new CatalogueStatusCounts(ready, processing, draft),
                recent,
                new Trends(monthly, categoryTrends, average(prices), prices.size(),
                        opportunities.size(), average(matchScores)));
    }

    @Cacheable(cacheNames = CacheInvalidationService.DASHBOARD_INSIGHTS, key = "'all'")
    public Insights insights() {
        return new Insights(List.of(
                new Insight("GROWTH", "Track buyer requests and completed sales to identify seasonal demand."),
                new Insight("PRICING", "Review material costs and artisan work days before publishing a suggested price."),
                new Insight("OPPORTUNITY", "Respond promptly to wholesale quotation requests to build repeat buyer relationships.")));
    }

    private static Double number(JsonNode node, String field) {
        if (node == null || !node.path(field).isNumber()) {
            return null;
        }
        return node.path(field).asDouble();
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.path(field).isTextual()) {
            return null;
        }
        return node.path(field).asText();
    }

    private static Double average(List<Double> values) {
        return values.isEmpty() ? null : values.stream().mapToDouble(Double::doubleValue).average().orElseThrow();
    }

    private static class CategoryAccumulator {
        private int products;
        private final List<Double> prices = new ArrayList<>();
    }
}
