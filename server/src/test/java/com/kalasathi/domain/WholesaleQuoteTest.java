package com.kalasathi.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class WholesaleQuoteTest {
    @Test
    void appliesTenPercentVolumeTierAndProductionLeadTimeFloor() {
        WholesaleQuote.Estimate estimate = WholesaleQuote.estimate(
                50, 3850, 14, "Sustainable Jute Keepsake Bag");

        assertEquals(10, estimate.discount_percent());
        assertEquals(3465, estimate.unit_price());
        assertEquals(173250, estimate.estimated_total());
        assertEquals(14, estimate.estimated_lead_days());
    }

    @Test
    void appliesHighestTierAndWoodenPackagingSurcharge() {
        WholesaleQuote.Estimate estimate = WholesaleQuote.estimate(
                200, 3850, 14, "Laser-Engraved Corporate Wooden Box");

        assertEquals(18, estimate.discount_percent());
        assertEquals(3277, estimate.unit_price());
        assertEquals(655400, estimate.estimated_total());
        assertEquals(50, estimate.estimated_lead_days());
    }
}
