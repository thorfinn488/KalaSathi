package com.kalasathi.controller;

import com.kalasathi.dto.ApiResponse;
import com.kalasathi.dto.OrderDtos.CheckoutRequest;
import com.kalasathi.dto.OrderDtos.OrderResponse;
import com.kalasathi.dto.OrderDtos.OrderStatusRequest;
import com.kalasathi.dto.OrderDtos.PaymentVerificationRequest;
import com.kalasathi.dto.OrderDtos.WebhookAcknowledgement;
import com.kalasathi.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ApiResponse<List<OrderResponse>> list(
            Authentication authentication, @RequestParam(required = false) String phone) {
        return ApiResponse.success(orderService.list(
                authentication.getName(), hasRole(authentication, "ADMIN"), phone));
    }

    @GetMapping("/track/{query}")
    public ApiResponse<List<OrderResponse>> track(@PathVariable String query) {
        return ApiResponse.success(orderService.track(query));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(@Valid @RequestBody CheckoutRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(orderService.checkout(request)));
    }

    @PostMapping("/{id}/payment/verify")
    public ApiResponse<OrderResponse> verifyPayment(
            @PathVariable String id, @Valid @RequestBody PaymentVerificationRequest request) {
        return ApiResponse.success(orderService.verifyPayment(id, request));
    }

    @PostMapping("/webhook")
    public ApiResponse<WebhookAcknowledgement> razorpayWebhook(
            @RequestBody byte[] rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        return ApiResponse.success(orderService.handleWebhook(rawBody, signature));
    }

    @PostMapping("/{id}/payment/sandbox-confirm")
    public ApiResponse<OrderResponse> confirmSandbox(
            @PathVariable String id,
            @RequestBody(required = false) Object requestBody) {
        return ApiResponse.success(orderService.confirmSandbox(id));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<OrderResponse> updateDeliveryStatus(
            @PathVariable String id, @Valid @RequestBody OrderStatusRequest request) {
        return ApiResponse.success(orderService.updateDeliveryStatus(id, request.delivery_status()));
    }

    private static boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(value -> value.equals("ROLE_" + role));
    }
}
