package com.kalasathi.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;

public final class OrderDtos {
    private OrderDtos() {
    }

    public record CheckoutRequest(
            @NotBlank String product_id,
            @NotBlank @Size(min = 2, max = 255) String customer_name,
            @NotBlank @Size(min = 10, max = 20) String customer_phone,
            @NotBlank @Size(min = 8, max = 1000) String shipping_address,
            @NotNull @Min(1) @Max(100) Integer quantity) {
        public CheckoutRequest {
            if (product_id != null) {
                product_id = product_id.trim();
            }
            if (customer_name != null) {
                customer_name = customer_name.trim();
            }
            if (customer_phone != null) {
                customer_phone = customer_phone.trim();
            }
            if (shipping_address != null) {
                shipping_address = shipping_address.trim();
            }
        }
    }

    public record PaymentVerificationRequest(
            @NotBlank String razorpay_order_id,
            @NotBlank String razorpay_payment_id,
            @NotBlank @Pattern(regexp = "(?i)[a-f0-9]{64}") String razorpay_signature) {
    }

    public record OrderStatusRequest(
            @NotBlank @Pattern(regexp = "CRAFTING|QUALITY_CHECK|SHIPPED|DELIVERED") String delivery_status) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record OrderResponse(
            String order_id,
            String product_name,
            String artisan_name,
            int quantity,
            BigDecimal unit_price,
            BigDecimal total_amount,
            String payment_method,
            String payment_status,
            String delivery_status,
            String created_at,
            String estimated_delivery,
            String payment_mode,
            Checkout checkout) {
    }

    public record Checkout(String key_id, String order_id, long amount, String currency) {
    }

    public record WebhookAcknowledgement(boolean received) {
    }

    public record PaymentVerificationResponse(
            String razorpay_order_id,
            String razorpay_payment_id,
            String razorpay_signature) {
    }
}
