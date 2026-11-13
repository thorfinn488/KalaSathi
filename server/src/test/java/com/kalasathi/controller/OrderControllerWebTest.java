package com.kalasathi.controller;

import com.kalasathi.dto.OrderDtos.Checkout;
import com.kalasathi.dto.OrderDtos.OrderResponse;
import com.kalasathi.dto.OrderDtos.WebhookAcknowledgement;
import com.kalasathi.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OrderControllerWebTest {
    private final OrderService orderService = mock(OrderService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new OrderController(orderService)).build();
    }

    @Test
    void checkoutReturnsTheExistingRazorpayResponseContract() throws Exception {
        when(orderService.checkout(any())).thenReturn(new OrderResponse(
                "KS-ABC123", "Test Craft", "Test Artisan", 2,
                new BigDecimal("3850.00"), new BigDecimal("7700.00"),
                "Razorpay Test Checkout", "PENDING", "CRAFTING", "2026-01-01T00:00:00Z",
                "8 Jan 2026", "razorpay", new Checkout("rzp_test_id", "order_gateway", 770000, "INR")));

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "product_id":"prod_test",
                                  "customer_name":"Buyer Name",
                                  "customer_phone":"9899988877",
                                  "shipping_address":"1 Test Street",
                                  "quantity":2
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.payment_mode").value("razorpay"))
                .andExpect(jsonPath("$.data.checkout.key_id").value("rzp_test_id"))
                .andExpect(jsonPath("$.data.checkout.order_id").value("order_gateway"))
                .andExpect(jsonPath("$.data.checkout.amount").value(770000))
                .andExpect(jsonPath("$.data.total_amount").value(7700.00));
    }

    @Test
    void webhookPassesRawBodyAndSignatureToVerifier() throws Exception {
        when(orderService.handleWebhook(any(byte[].class), eq("valid-signature")))
                .thenReturn(new WebhookAcknowledgement(true));

        mockMvc.perform(post("/api/orders/webhook")
                        .header("X-Razorpay-Signature", "valid-signature")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"event\":\"payment.captured\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.received").value(true));

        verify(orderService).handleWebhook(any(byte[].class), eq("valid-signature"));
    }
}
