package com.kalasathi.domain;

import java.util.List;

public final class WholesaleQuote {
    public static final List<String> PACKAGING_OPTIONS = List.of(
            "Sustainable Jute Keepsake Bag",
            "Eco-Friendly Kraft Gift Box",
            "Laser-Engraved Corporate Wooden Box");

    private WholesaleQuote() {
    }

    public static Estimate estimate(
            int quantity, double basePrice, int baseLeadDays, String packaging) {
        int discountPercent = quantity >= 200 ? 18 : quantity >= 50 ? 10 : 0;
        int packagingSurcharge = "Laser-Engraved Corporate Wooden Box".equals(packaging) ? 120 : 0;
        long unitPrice = Math.round(basePrice * (1 - discountPercent / 100.0)) + packagingSurcharge;
        return new Estimate(
                discountPercent,
                unitPrice,
                unitPrice * quantity,
                Math.max(baseLeadDays, (int) Math.ceil(quantity / 4.0)));
    }

    public record Estimate(
            int discount_percent, long unit_price, long estimated_total, int estimated_lead_days) {
    }
}
