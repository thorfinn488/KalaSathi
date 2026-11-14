package com.kalasathi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kalasathi.dto.OrderDtos.Checkout;
import com.kalasathi.dto.OrderDtos.CheckoutRequest;
import com.kalasathi.dto.OrderDtos.OrderResponse;
import com.kalasathi.dto.OrderDtos.PaymentVerificationRequest;
import com.kalasathi.dto.OrderDtos.WebhookAcknowledgement;
import com.kalasathi.entity.OrderEntity;
import com.kalasathi.entity.ProductEntity;
import com.kalasathi.entity.UserEntity;
import com.kalasathi.exception.ApiException;
import com.kalasathi.repository.OrderRepository;
import com.kalasathi.repository.ProductRepository;
import com.kalasathi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Base64;
import java.util.UUID;

@Service
public class OrderService {
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);
    private static final String RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders";
    private static final DateTimeFormatter DELIVERY_FORMAT =
            DateTimeFormatter.ofPattern("d MMM yyyy", Locale.forLanguageTag("en-IN"))
                    .withZone(ZoneId.of("Asia/Kolkata"));

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final String paymentMode;
    private final String razorpayKeyId;
    private final String razorpayKeySecret;
    private final String razorpayWebhookSecret;
    private final boolean production;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final CacheInvalidationService cacheInvalidationService;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper,
            HttpClient httpClient,
            @Value("${app.razorpay.payment-mode}") String paymentMode,
            @Value("${app.razorpay.key-id}") String razorpayKeyId,
            @Value("${app.razorpay.key-secret}") String razorpayKeySecret,
            @Value("${app.razorpay.webhook-secret}") String razorpayWebhookSecret,
            @Value("${spring.profiles.active:}") String activeProfiles,
            @Value("${NODE_ENV:}") String nodeEnvironment,
            CacheInvalidationService cacheInvalidationService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.paymentMode = paymentMode.toLowerCase(Locale.ROOT);
        this.razorpayKeyId = razorpayKeyId;
        this.razorpayKeySecret = razorpayKeySecret;
        this.razorpayWebhookSecret = razorpayWebhookSecret;
        this.production = "production".equalsIgnoreCase(nodeEnvironment)
                || activeProfiles.contains("prod");
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
        this.cacheInvalidationService = cacheInvalidationService;
        if (!this.paymentMode.equals("sandbox") && !this.paymentMode.equals("razorpay")) {
            throw new IllegalStateException("PAYMENT_MODE must be sandbox or razorpay.");
        }
        if (razorpayKeyId.isBlank() != razorpayKeySecret.isBlank()) {
            throw new IllegalStateException(
                    "Configure both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET together.");
        }
        if (this.paymentMode.equals("razorpay")
                && (razorpayKeyId.isBlank() || razorpayKeySecret.isBlank() || razorpayWebhookSecret.isBlank())) {
            throw new IllegalStateException(
                    "Razorpay test checkout requires RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET.");
        }
        if (this.paymentMode.equals("razorpay") && !razorpayKeyId.startsWith("rzp_test_")) {
            throw new IllegalStateException("Only Razorpay test credentials are supported.");
        }
        if (production && !this.paymentMode.equals("razorpay")) {
            throw new IllegalStateException("Production requires Razorpay test checkout.");
        }
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> list(String userId, boolean admin, String requestedPhone) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User session not found", HttpStatus.UNAUTHORIZED));
        String phone = admin && requestedPhone != null && !requestedPhone.isBlank()
                ? requestedPhone : user.getPhone();
        return orderRepository.findAllByCustomerPhoneOrderByCreatedAtDesc(phone).stream()
                .map(this::publicOrder).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> track(String query) {
        String normalized = query.trim();
        List<OrderResponse> results = new ArrayList<>();
        orderRepository.findById(normalized.toUpperCase()).map(this::publicOrder).ifPresent(results::add);
        orderRepository.findAllByCustomerPhoneOrderByCreatedAtDesc(normalized)
                .stream().map(this::publicOrder).forEach(results::add);
        if (results.isEmpty()) {
            throw new ApiException("ORDER_NOT_FOUND",
                    "No order found. Check the exact order ID or registered phone number.", HttpStatus.NOT_FOUND);
        }
        return results.stream().distinct()
                .sorted(Comparator.comparing(OrderResponse::created_at).reversed()).toList();
    }

    @Transactional
    public OrderResponse checkout(CheckoutRequest request) {
        ProductEntity product = productRepository.findById(request.product_id())
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Product not found.", HttpStatus.NOT_FOUND));
        double price = price(product.getPricing(), product.getPrice());
        if (!Double.isFinite(price) || price <= 0) {
            throw new ApiException("PRODUCT_UNPRICED",
                    "This product has no valid published price yet.", HttpStatus.CONFLICT);
        }
        String mode = paymentMode.equals("razorpay") ? "razorpay" : "sandbox";
        String orderId = "KS-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        String estimatedDelivery = DELIVERY_FORMAT.format(Instant.now().plusSeconds(7 * 86400L));
        BigDecimal unitPrice = BigDecimal.valueOf(price).setScale(2, RoundingMode.HALF_UP);
        double totalValue = Math.round(price * request.quantity() * 100.0) / 100.0;
        BigDecimal total = BigDecimal.valueOf(totalValue).setScale(2, RoundingMode.HALF_UP);
        BigDecimal materialExpense = product.getMaterialCost() != null && product.getMaterialCost().signum() > 0
                ? product.getMaterialCost().multiply(BigDecimal.valueOf(request.quantity()))
                        .setScale(2, RoundingMode.HALF_UP)
                : null;
        String artisanName = product.getArtisanName();
        if (artisanName == null && product.getArtisan() != null) {
            artisanName = product.getArtisan().getName();
        }
        String productName = catalogueName(product.getCatalogue());
        String paymentMethod;
        String razorpayOrderId = null;
        Checkout checkout = null;
        if (mode.equals("razorpay")) {
            long amountPaise = total.movePointRight(2).longValueExact();
            RazorpayOrder gatewayOrder = createRazorpayOrder(
                    orderId, product.getId(), request.quantity(), amountPaise);
            razorpayOrderId = gatewayOrder.id();
            checkout = new Checkout(razorpayKeyId, gatewayOrder.id(), gatewayOrder.amount(), gatewayOrder.currency());
            paymentMethod = "Razorpay Test Checkout";
        } else {
            paymentMethod = "Sandbox Checkout";
        }
        OrderEntity entity = new OrderEntity(
                orderId,
                product,
                productName,
                artisanName == null ? "Cluster Artisan" : artisanName,
                request.customer_name(),
                request.customer_phone(),
                request.shipping_address(),
                request.quantity(),
                unitPrice,
                total);
        entity.setPaymentMethod(paymentMethod);
        entity.setPaymentStatus(OrderEntity.PaymentStatus.PENDING);
        entity.setRazorpayOrderId(razorpayOrderId);
        entity.setMaterialExpense(materialExpense);
        entity.setDeliveryStatus(OrderEntity.DeliveryStatus.CRAFTING);
        entity.setEstimatedDelivery(estimatedDelivery);
        return toCheckoutOrder(orderRepository.save(entity), mode, checkout);
    }

    @Transactional
    public OrderResponse verifyPayment(String id, PaymentVerificationRequest request) {
        if (razorpayKeySecret.isBlank()) {
            throw new ApiException("PAYMENT_UNAVAILABLE", "Razorpay checkout is not configured.", HttpStatus.SERVICE_UNAVAILABLE);
        }
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Order not found.", HttpStatus.NOT_FOUND));
        if (order.getRazorpayOrderId() == null || !order.getRazorpayOrderId().equals(request.razorpay_order_id())) {
            throw new ApiException("PAYMENT_MISMATCH", "Payment does not match this order.", HttpStatus.BAD_REQUEST);
        }
        if (!request.razorpay_signature().matches("(?i)[a-f0-9]{64}")) {
            throw new ApiException("VALIDATION_ERROR", "Invalid Razorpay payment confirmation.", HttpStatus.BAD_REQUEST);
        }
        byte[] expected = hmac(razorpayKeySecret,
                request.razorpay_order_id() + "|" + request.razorpay_payment_id());
        byte[] received = HexFormat.of().parseHex(request.razorpay_signature());
        if (!MessageDigest.isEqual(expected, received)) {
            throw new ApiException("INVALID_PAYMENT_SIGNATURE", "Payment signature verification failed.", HttpStatus.BAD_REQUEST);
        }
        if (order.getPaymentStatus() != OrderEntity.PaymentStatus.PAID) {
            order.setPaymentStatus(OrderEntity.PaymentStatus.PAID);
            order.setRazorpayPaymentId(request.razorpay_payment_id());
            cacheInvalidationService.ordersChanged();
        }
        return publicOrder(order);
    }

    @Transactional
    public WebhookAcknowledgement handleWebhook(byte[] rawBody, String signature) {
        if (razorpayWebhookSecret.isBlank()) {
            throw new ApiException(
                    "PAYMENT_UNAVAILABLE", "Razorpay webhook verification is not configured.", HttpStatus.SERVICE_UNAVAILABLE);
        }
        if (rawBody == null || signature == null || !signature.matches("(?i)[a-f0-9]{64}")) {
            throw invalidWebhookSignature();
        }
        byte[] expected = hmac(razorpayWebhookSecret, rawBody);
        byte[] received = HexFormat.of().parseHex(signature);
        if (!MessageDigest.isEqual(expected, received)) {
            throw invalidWebhookSignature();
        }

        final JsonNode event;
        try {
            event = objectMapper.readTree(rawBody);
        } catch (IOException exception) {
            throw new ApiException("VALIDATION_ERROR", "Webhook body is not valid JSON.", HttpStatus.BAD_REQUEST);
        }
        if (!event.path("event").asText().equals("payment.captured")) {
            return new WebhookAcknowledgement(true);
        }

        JsonNode payment = event.path("payload").path("payment").path("entity");
        String gatewayOrderId = payment.path("order_id").asText("");
        String paymentId = payment.path("id").asText("");
        if (gatewayOrderId.isBlank() || paymentId.isBlank()) {
            throw new ApiException("VALIDATION_ERROR", "Webhook payment details are incomplete.", HttpStatus.BAD_REQUEST);
        }
        OrderEntity order = orderRepository.findFirstByRazorpayOrderId(gatewayOrderId)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Order not found.", HttpStatus.NOT_FOUND));
        if (order.getPaymentStatus() != OrderEntity.PaymentStatus.PAID) {
            order.setPaymentStatus(OrderEntity.PaymentStatus.PAID);
            order.setRazorpayPaymentId(paymentId);
            cacheInvalidationService.ordersChanged();
        }
        return new WebhookAcknowledgement(true);
    }

    @Transactional
    public OrderResponse confirmSandbox(String id) {
        if (production || !paymentMode.equalsIgnoreCase("sandbox")) {
            throw new ApiException("SANDBOX_DISABLED", "Sandbox payment confirmation is disabled.", HttpStatus.FORBIDDEN);
        }
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Order not found.", HttpStatus.NOT_FOUND));
        if (order.getPaymentStatus() == OrderEntity.PaymentStatus.PENDING) {
            order.setPaymentStatus(OrderEntity.PaymentStatus.PAID);
            cacheInvalidationService.ordersChanged();
        } else if (order.getPaymentStatus() != OrderEntity.PaymentStatus.PAID) {
            throw new ApiException("INVALID_ORDER_STATE",
                    "Order cannot be confirmed in the current state.", HttpStatus.CONFLICT);
        }
        return toCheckoutOrder(order, "sandbox", null);
    }

    @Transactional
    public OrderResponse updateDeliveryStatus(String id, String status) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Order not found.", HttpStatus.NOT_FOUND));
        try {
            order.setDeliveryStatus(OrderEntity.DeliveryStatus.valueOf(status));
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new ApiException("VALIDATION_ERROR", "A valid delivery_status is required.", HttpStatus.BAD_REQUEST);
        }
        return publicOrder(order);
    }

    private OrderResponse publicOrder(OrderEntity order) {
        return new OrderResponse(
                order.getId(), order.getProductName(), order.getArtisanName(), order.getQuantity(),
                order.getUnitPrice(), order.getTotalAmount(), order.getPaymentMethod(),
                order.getPaymentStatus() == null ? null : order.getPaymentStatus().name(),
                order.getDeliveryStatus() == null ? null : order.getDeliveryStatus().name(),
                order.getCreatedAt().toString(), order.getEstimatedDelivery(), null, null);
    }

    private OrderResponse toCheckoutOrder(OrderEntity order, String mode, Checkout checkout) {
        return new OrderResponse(
                order.getId(), order.getProductName(), order.getArtisanName(), order.getQuantity(),
                order.getUnitPrice(), order.getTotalAmount(), order.getPaymentMethod(),
                order.getPaymentStatus().name(), order.getDeliveryStatus().name(),
                order.getCreatedAt().toString(), order.getEstimatedDelivery(), mode, checkout);
    }

    private static double price(JsonNode pricing, JsonNode legacyPrice) {
        JsonNode node = pricing == null ? null : pricing.get("suggested_price");
        if (node == null || !node.isNumber()) {
            node = legacyPrice == null ? null : legacyPrice.get("suggested_price");
        }
        return node != null && node.isNumber() ? node.asDouble() : 0;
    }

    private static String catalogueName(JsonNode catalogue) {
        return catalogue != null && catalogue.path("name").isTextual()
                ? catalogue.path("name").asText() : "Handcrafted Heritage Piece";
    }

    private RazorpayOrder createRazorpayOrder(
            String receipt, String productId, int quantity, long amountPaise) {
        var payload = objectMapper.createObjectNode()
                .put("amount", amountPaise)
                .put("currency", "INR")
                .put("receipt", receipt);
        payload.putObject("notes")
                .put("product_id", productId)
                .put("quantity", Integer.toString(quantity));
        String credentials = Base64.getEncoder().encodeToString(
                (razorpayKeyId + ":" + razorpayKeySecret).getBytes(StandardCharsets.UTF_8));
        HttpRequest request = HttpRequest.newBuilder(URI.create(RAZORPAY_ORDERS_URL))
                .timeout(java.time.Duration.ofSeconds(15))
                .header("Authorization", "Basic " + credentials)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                logger.error("Razorpay order creation returned HTTP {}.", response.statusCode());
                throw paymentUnavailable();
            }
            JsonNode result = objectMapper.readTree(response.body());
            String gatewayOrderId = result.path("id").asText("");
            long amount = result.path("amount").asLong(-1);
            String currency = result.path("currency").asText("");
            if (gatewayOrderId.isBlank() || amount != amountPaise || !currency.equals("INR")) {
                logger.error("Razorpay returned incomplete or mismatched order details.");
                throw paymentUnavailable();
            }
            return new RazorpayOrder(gatewayOrderId, amount, currency);
        } catch (IOException exception) {
            logger.error("Razorpay order creation request failed.", exception);
            throw paymentUnavailable();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            logger.error("Razorpay order creation request was interrupted.", exception);
            throw paymentUnavailable();
        }
    }

    private static ApiException paymentUnavailable() {
        return new ApiException(
                "PAYMENT_UNAVAILABLE",
                "Razorpay checkout is temporarily unavailable. Please try again later.",
                HttpStatus.SERVICE_UNAVAILABLE);
    }

    private static ApiException invalidWebhookSignature() {
        return new ApiException(
                "INVALID_WEBHOOK_SIGNATURE",
                "Razorpay webhook signature verification failed.",
                HttpStatus.BAD_REQUEST);
    }

    private static byte[] hmac(String secret, byte[] message) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return mac.doFinal(message);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("HMAC-SHA256 is unavailable.", exception);
        }
    }

    private static byte[] hmac(String secret, String message) {
        return hmac(secret, message.getBytes(StandardCharsets.UTF_8));
    }

    private record RazorpayOrder(String id, long amount, String currency) {
    }
}
