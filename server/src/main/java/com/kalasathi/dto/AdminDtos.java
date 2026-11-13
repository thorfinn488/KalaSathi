package com.kalasathi.dto;

public final class AdminDtos {
    private AdminDtos() {
    }

    public record Artisan(
            String artisan_id, String user_id, String name, String phone,
            String region, String craft_specialty, String created_at) {
    }

    public record Product(
            String product_id, String artisan_id, String artisan_name,
            String status, String created_at, String catalogue_name, Double suggested_price) {
    }

    public record Opportunity(
            String opportunity_id, String product_id, String buyer_name, String buyer_contact,
            String company_name, int match_score, String status, String requirement,
            Integer quantity, String budget, String created_at) {
    }
}
