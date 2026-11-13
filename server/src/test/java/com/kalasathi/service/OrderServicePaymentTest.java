package com.kalasathi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.kalasathi.dto.OrderDtos.CheckoutRequest;
import com.kalasathi.dto.OrderDtos.PaymentVerificationRequest;
import com.kalasathi.entity.OrderEntity;
import com.kalasathi.entity.ProductEntity;
import com.kalasathi.exception.ApiException;
import com.kalasathi.repository.OrderRepository;
import com.kalasathi.repository.ProductRepository;
import com.kalasathi.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrderServicePaymentTest {
    private static final String KEY_ID = "rzp_test_unit_key";
    private static final String KEY_SECRET = "fake-unit-test-key-secret";
    private static final String WEBHOOK_SECRET = "fake-unit-test-webhook-secret";

    private final OrderRepository orderRepository = mock(OrderRepository.class);
    private final ProductRepository productRepository = mock(ProductRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final HttpClient httpClient = mock(HttpClient.class);
    private final CacheInvalidationService cacheInvalidationService = mock(CacheInvalidationService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private ProductEntity product;

    @BeforeEach
    void setUp() {
        product = new ProductEntity("prod_test", null, "Test Artisan", ProductEntity.Status.READY);
        ObjectNode pricing = objectMapper.createObjectNode();
        pricing.put("suggested_price", 3850);
        product.setPricing(pricing);
        ObjectNode catalogue = objectMapper.createObjectNode();
        catalogue.put("name", "Test Craft");
        product.setCatalogue(catalogue);
        when(productRepository.findById("prod_test")).thenReturn(Optional.of(product));
    }

    @Test
    void sandboxCheckoutComputesServerSideTotalFromProductPrice() {
        OrderService service = service("sandbox", "", "", "");
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> {
            OrderEntity order = invocation.getArgument(0);
            order.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
            return order;
        });

        var response = service.checkout(request(2));

        assertEquals(7700.00, response.total_amount().doubleValue());
        assertEquals(3850.00, response.unit_price().doubleValue());
        assertEquals("sandbox", response.payment_mode());
        assertEquals("Sandbox Checkout", response.payment_method());
        assertEquals("PENDING", response.payment_status());
    }

    @Test
    @SuppressWarnings("unchecked")
    void razorpayCheckoutUsesTestCredentialsAndServerComputedAmount() throws Exception {
        OrderService service = service("razorpay", KEY_ID, KEY_SECRET, WEBHOOK_SECRET);
        HttpResponse<String> gatewayResponse = mock(HttpResponse.class);
        when(gatewayResponse.statusCode()).thenReturn(200);
        when(gatewayResponse.body()).thenReturn(
                "{\"id\":\"order_gateway_test\",\"amount\":770000,\"currency\":\"INR\"}");
        doReturn(gatewayResponse).when(httpClient).send(any(HttpRequest.class), any());
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> {
            OrderEntity order = invocation.getArgument(0);
            order.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
            return order;
        });

        var response = service.checkout(request(2));

        assertEquals("razorpay", response.payment_mode());
        assertEquals("Razorpay Test Checkout", response.payment_method());
        assertEquals("rzp_test_unit_key", response.checkout().key_id());
        assertEquals("order_gateway_test", response.checkout().order_id());
        assertEquals(770000, response.checkout().amount());
        assertEquals(7700.00, response.total_amount().doubleValue());
        verify(httpClient).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
    }

    @Test
    void webhookRejectsInvalidSignatureBeforeLookingUpAnOrder() {
        OrderService service = service("sandbox", "", "", WEBHOOK_SECRET);
        byte[] body = """
                {"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test","order_id":"order_test"}}}}
                """.getBytes(StandardCharsets.UTF_8);

        ApiException exception = assertThrows(
                ApiException.class, () -> service.handleWebhook(body, "0".repeat(64)));

        assertEquals("INVALID_WEBHOOK_SIGNATURE", exception.getCode());
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(orderRepository, org.mockito.Mockito.never()).findFirstByRazorpayOrderId(any());
    }

    @Test
    void validWebhookMarksMatchingOrderPaid() throws Exception {
        OrderService service = service("sandbox", "", "", WEBHOOK_SECRET);
        OrderEntity order = order("order_app", "order_gateway_test");
        String bodyText = """
                {"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_gateway_test","order_id":"order_gateway_test"}}}}
                """;
        byte[] body = bodyText.getBytes(StandardCharsets.UTF_8);
        when(orderRepository.findFirstByRazorpayOrderId("order_gateway_test")).thenReturn(Optional.of(order));

        var acknowledgement = service.handleWebhook(body, hmac(WEBHOOK_SECRET, body));

        assertEquals(true, acknowledgement.received());
        assertEquals(OrderEntity.PaymentStatus.PAID, order.getPaymentStatus());
        assertEquals("pay_gateway_test", order.getRazorpayPaymentId());
    }

    @Test
    void clientPaymentVerificationRejectsIncorrectSignature() {
        OrderService service = service("razorpay", KEY_ID, KEY_SECRET, WEBHOOK_SECRET);
        OrderEntity order = order("order_app", "order_gateway_test");
        when(orderRepository.findById("order_app")).thenReturn(Optional.of(order));

        ApiException exception = assertThrows(ApiException.class, () -> service.verifyPayment(
                "order_app",
                new PaymentVerificationRequest("order_gateway_test", "pay_test", "0".repeat(64))));

        assertEquals("INVALID_PAYMENT_SIGNATURE", exception.getCode());
        assertEquals(OrderEntity.PaymentStatus.PENDING, order.getPaymentStatus());
    }

    private OrderService service(String mode, String keyId, String keySecret, String webhookSecret) {
        return new OrderService(
                orderRepository, productRepository, userRepository, objectMapper, httpClient,
                mode, keyId, keySecret, webhookSecret, "", "", cacheInvalidationService);
    }

    private static CheckoutRequest request(int quantity) {
        return new CheckoutRequest("prod_test", "Buyer Name", "9899988877", "1 Test Street", quantity);
    }

    private static OrderEntity order(String id, String gatewayOrderId) {
        OrderEntity order = new OrderEntity(
                id, null, "Test Craft", "Test Artisan", "Buyer Name", "9899988877", "1 Test Street",
                2, java.math.BigDecimal.valueOf(3850), java.math.BigDecimal.valueOf(7700));
        order.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        order.setPaymentStatus(OrderEntity.PaymentStatus.PENDING);
        order.setRazorpayOrderId(gatewayOrderId);
        return order;
    }

    private static String hmac(String secret, byte[] body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(body));
    }
}
