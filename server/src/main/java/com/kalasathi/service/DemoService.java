package com.kalasathi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.kalasathi.dto.DemoDtos.ArtisanProfit;
import com.kalasathi.dto.DemoDtos.LowStockProduct;
import com.kalasathi.entity.OrderEntity;
import com.kalasathi.entity.ProductEntity;
import com.kalasathi.repository.OrderRepository;
import com.kalasathi.repository.ProductRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DemoService {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public DemoService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheInvalidationService.ARTISAN_PROFIT, key = "'all'")
    public List<ArtisanProfit> artisanProfit() {
        Map<String, ProfitAccumulator> totals = new LinkedHashMap<>();
        for (OrderEntity order : orderRepository.findAllByOrderByCreatedAtDesc()) {
            if (order.getPaymentStatus() != OrderEntity.PaymentStatus.PAID || order.getProduct() == null) {
                continue;
            }
            ProductEntity product = order.getProduct();
            String artisanId = product.getArtisan() == null ? "unassigned" : product.getArtisan().getId();
            String name = product.getArtisanName() != null ? product.getArtisanName()
                    : product.getArtisan() == null ? "Unassigned artisan" : product.getArtisan().getName();
            ProfitAccumulator accumulator = totals.computeIfAbsent(
                    artisanId, ignored -> new ProfitAccumulator(name));
            accumulator.revenue += order.getTotalAmount().doubleValue();
            accumulator.orders++;
            if (order.getMaterialExpense() != null) {
                accumulator.expenses += order.getMaterialExpense().doubleValue();
                accumulator.costedOrders++;
            }
        }
        return totals.entrySet().stream().map(entry -> {
            ProfitAccumulator value = entry.getValue();
            Double expenses = value.costedOrders == value.orders ? value.expenses : null;
            Double netProfit = expenses == null ? null : value.revenue - value.expenses;
            return new ArtisanProfit(entry.getKey(), value.artisan, value.revenue, expenses, netProfit);
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<LowStockProduct> lowStockProducts() {
        List<LowStockProduct> result = new ArrayList<>();
        for (ProductEntity product : productRepository.findAllByOrderByCreatedAtDesc()) {
            if (product.getStock() > product.getLowStockThreshold()
                    || (product.getStatus() != ProductEntity.Status.READY
                    && product.getStatus() != ProductEntity.Status.PUBLISHED)) {
                continue;
            }
            String name = text(product.getCatalogue(), "name");
            String artisanName = product.getArtisanName() != null ? product.getArtisanName()
                    : product.getArtisan() == null ? "Unassigned artisan" : product.getArtisan().getName();
            result.add(new LowStockProduct(
                    product.getId(), name == null ? "Untitled craft piece" : name,
                    product.getArtisan() == null ? "" : product.getArtisan().getId(),
                    artisanName, product.getStock(), product.getLowStockThreshold()));
        }
        return result.stream().sorted(java.util.Comparator.comparingInt(LowStockProduct::stock)).toList();
    }

    private static String text(JsonNode node, String field) {
        return node != null && node.path(field).isTextual() ? node.path(field).asText() : null;
    }

    private static class ProfitAccumulator {
        private final String artisan;
        private double revenue;
        private double expenses;
        private int orders;
        private int costedOrders;

        private ProfitAccumulator(String artisan) {
            this.artisan = artisan;
        }
    }
}
