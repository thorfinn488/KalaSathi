package com.kalasathi.dto;

import com.kalasathi.entity.ProductEntity;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class ProductDtos {
    private ProductDtos() {
    }

    public record ProductCreateResponse(String product_id, String status) {
    }

    public record CreateProductRequest(@Size(max = 64) String artisan_id) {
    }

    public record ProcessRequest(@Size(max = 5000) String transcript) {
        public ProcessRequest {
            if (transcript != null) {
                transcript = transcript.trim();
            }
        }
    }

    public record MediaItem(String id, String url) {
    }

    public record OpportunityPreview(String buyer_name, int match_score, String location, String requirement) {
    }

    public record ProductResponse(
            String product_id,
            String artisan_id,
            String artisan_name,
            String region,
            String status,
            String created_at,
            String image_url,
            List<MediaItem> images,
            List<MediaItem> audio,
            String heritage_story,
            Integer moq,
            Integer lead_time_days,
            JsonNode catalogue,
            JsonNode price,
            JsonNode pricing,
            List<OpportunityPreview> opportunities) {
    }

    public record ProcessingStatusResponse(
            String product_id, String status, String step, int progress_percent, String error) {
    }

    public record ProcessingQueuedResponse(String product_id, String status, String job_id) {
    }

    public record ImageUploadResponse(String product_id, String image_url) {
    }

    public record AudioUploadResponse(String product_id, String audio_url) {
    }

    public record ProductUpdateResponse(String product_id, boolean updated) {
    }

    public record PriceResponse(double suggested_price, List<Double> price_range, String explanation) {
    }

    public record CatalogueRequest(
            @Size(min = 1, max = 255) String name,
            @Size(max = 5000) String description,
            @Size(min = 1, max = 255) String category,
            @Size(min = 1, max = 255) String craft,
            @Size(min = 1, max = 1000) String material,
            @Size(max = 30) List<@NotBlank @Size(max = 100) String> tags) {
        public boolean hasAnyValue() {
            return name != null || description != null || category != null || craft != null
                    || material != null || tags != null;
        }
    }

    public record PriceRequest(
            @DecimalMin("50") @DecimalMax("200000") double material_cost,
            @Min(1) @Max(365) int days_to_make,
            @NotBlank @Pattern(regexp = "low|medium|high") String complexity) {
    }

    public record ProductPatch(JsonNode price, JsonNode catalogue, ProductEntity.Status status) {
    }

    public record ProductOpportunityResponse(List<OpportunityPreview> opportunities) {
    }

    public record DeleteResponse(boolean deleted) {
    }
}
