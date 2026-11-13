package com.kalasathi.dto;

import java.util.List;

public final class DashboardDtos {
    private DashboardDtos() {
    }

    public record Summary(
            int total_products,
            CatalogueStatusCounts catalogue_status,
            List<ProductDtos.ProductResponse> recent_products,
            Trends trends) {
    }

    public record CatalogueStatusCounts(int ready, int processing, int draft) {
    }

    public record Trends(
            List<MonthlyActivity> monthly_activity,
            List<CategoryTrend> categories,
            Double average_suggested_price,
            int priced_products,
            int open_opportunities,
            Double average_match_score) {
    }

    public record MonthlyActivity(String month, int count) {
    }

    public record CategoryTrend(String name, int products, Double average_suggested_price) {
    }

    public record Insight(String type, String message) {
    }

    public record Insights(List<Insight> insights) {
    }
}
