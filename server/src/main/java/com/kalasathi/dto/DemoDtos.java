package com.kalasathi.dto;

public final class DemoDtos {
    private DemoDtos() {
    }

    public record ArtisanProfit(
            String artisan_id, String artisan, double revenue, Double expenses, Double net_profit) {
    }

    public record LowStockProduct(
            String product_id, String product_name, String artisan_id,
            String artisan_name, int stock, int low_stock_threshold) {
    }
}
