package com.kalasathi.dto;

import com.kalasathi.entity.OpportunityEntity;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class OpportunityDtos {
    private OpportunityDtos() {
    }

    public record OpportunityRequest(
            @NotBlank @Size(min = 2, max = 255) String buyer_name,
            @NotBlank @Size(min = 5, max = 255) String contact_info,
            @Size(max = 255) String company_name,
            @NotBlank @Size(min = 5, max = 5000) String requirement,
            @NotBlank String product_id,
            @NotNull @Min(1) @Max(100000) Integer quantity,
            @Size(max = 100) String budget,
            String packaging) {
    }

    public record OpportunityListItem(
            String opportunity_id,
            String product_id,
            String buyer_name,
            String company_name,
            int match_score,
            String status,
            String requirement) {
    }

    public record OpportunityCreatedResponse(
            String opportunity_id,
            String product_id,
            String buyer_name,
            String company_name,
            int match_score,
            String status,
            String requirement,
            Integer quantity,
            String budget,
            Integer moq,
            int discount_percent,
            double unit_price,
            double estimated_total,
            int estimated_lead_days) {
        public static OpportunityCreatedResponse from(
                OpportunityEntity entity, String productId, int moq,
                int discountPercent, double unitPrice, double total, int leadDays) {
            return new OpportunityCreatedResponse(entity.getId(), productId, entity.getBuyerName(),
                    entity.getCompanyName(), entity.getMatchScore(), entity.getStatus(),
                    entity.getRequirement(), entity.getQuantity(), entity.getBudget(),
                    moq, discountPercent, unitPrice, total, leadDays);
        }
    }
}
