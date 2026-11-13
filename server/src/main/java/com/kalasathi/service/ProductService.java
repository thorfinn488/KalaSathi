package com.kalasathi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.kalasathi.dto.ProductDtos.CatalogueRequest;
import com.kalasathi.dto.ProductDtos.AudioUploadResponse;
import com.kalasathi.dto.ProductDtos.DeleteResponse;
import com.kalasathi.dto.ProductDtos.ImageUploadResponse;
import com.kalasathi.dto.ProductDtos.MediaItem;
import com.kalasathi.dto.ProductDtos.OpportunityPreview;
import com.kalasathi.dto.ProductDtos.PriceRequest;
import com.kalasathi.dto.ProductDtos.PriceResponse;
import com.kalasathi.dto.ProductDtos.ProcessingQueuedResponse;
import com.kalasathi.dto.ProductDtos.ProcessingStatusResponse;
import com.kalasathi.dto.ProductDtos.ProductCreateResponse;
import com.kalasathi.dto.ProductDtos.ProductOpportunityResponse;
import com.kalasathi.dto.ProductDtos.ProductPatch;
import com.kalasathi.dto.ProductDtos.ProductResponse;
import com.kalasathi.dto.ProductDtos.ProcessRequest;
import com.kalasathi.entity.OpportunityEntity;
import com.kalasathi.entity.ProductEntity;
import com.kalasathi.entity.ProductMediaEntity;
import com.kalasathi.entity.UserEntity;
import com.kalasathi.exception.ApiException;
import com.kalasathi.repository.OpportunityRepository;
import com.kalasathi.repository.ProductMediaRepository;
import com.kalasathi.repository.ProductRepository;
import com.kalasathi.repository.UserRepository;
import org.springframework.cache.annotation.Cacheable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ProductService {
    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductMediaRepository mediaRepository;
    private final OpportunityRepository opportunityRepository;
    private final ObjectMapper objectMapper;
    private final MediaContentValidator mediaContentValidator;
    private final S3MediaStorageService mediaStorageService;
    private final ImageEnhancementQueue imageEnhancementQueue;
    private final CacheInvalidationService cacheInvalidationService;

    public ProductService(
            ProductRepository productRepository,
            UserRepository userRepository,
            ProductMediaRepository mediaRepository,
            OpportunityRepository opportunityRepository,
            ObjectMapper objectMapper,
            MediaContentValidator mediaContentValidator,
            S3MediaStorageService mediaStorageService,
            ImageEnhancementQueue imageEnhancementQueue,
            CacheInvalidationService cacheInvalidationService) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.mediaRepository = mediaRepository;
        this.opportunityRepository = opportunityRepository;
        this.objectMapper = objectMapper;
        this.mediaContentValidator = mediaContentValidator;
        this.mediaStorageService = mediaStorageService;
        this.imageEnhancementQueue = imageEnhancementQueue;
        this.cacheInvalidationService = cacheInvalidationService;
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheInvalidationService.PRODUCT_LIST, key = "'all'")
    public List<ProductResponse> list() {
        return productRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheInvalidationService.PRODUCT_DETAIL, key = "#id")
    public ProductResponse get(String id) {
        return toResponse(findProduct(id));
    }

    @Transactional
    public ProductCreateResponse createDraft(String userId, boolean admin, String requestedArtisanId) {
        String artisanId = admin && requestedArtisanId != null && !requestedArtisanId.isBlank()
                ? requestedArtisanId : userId;
        UserEntity artisan = userRepository.findById(artisanId)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Artisan account not found.", HttpStatus.NOT_FOUND));
        ProductEntity product = new ProductEntity(
                "prod_" + UUID.randomUUID(), artisan, null, ProductEntity.Status.DRAFT);
        product.setProcessingStep("draft");
        product.setProcessingProgress(0);
        ProductEntity saved = productRepository.save(product);
        cacheInvalidationService.productChanged(saved.getId());
        return new ProductCreateResponse(saved.getId(), saved.getStatus().name());
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheInvalidationService.PRODUCT_OPPORTUNITIES, key = "#productId")
    public ProductOpportunityResponse opportunities(String productId) {
        findProduct(productId);
        List<OpportunityPreview> items = opportunityRepository
                .findAllByProduct_IdOrderByCreatedAtDesc(productId).stream()
                .map(item -> preview(item, "Verified Procurement Lead"))
                .toList();
        return new ProductOpportunityResponse(items);
    }

    @Transactional
    public void updateCatalogue(String userId, boolean admin, String id, CatalogueRequest request) {
        requireOwner(findProduct(id), userId, admin);
        if (!request.hasAnyValue()) {
            throw new ApiException("VALIDATION_ERROR", "At least one catalogue field must be provided.", HttpStatus.BAD_REQUEST);
        }
        ProductEntity product = findProduct(id);
        ObjectNode catalogue = product.getCatalogue() != null && product.getCatalogue().isObject()
                ? ((ObjectNode) product.getCatalogue().deepCopy()) : objectMapper.createObjectNode();
        copyIfPresent(catalogue, "name", request.name());
        copyIfPresent(catalogue, "description", request.description());
        copyIfPresent(catalogue, "category", request.category());
        copyIfPresent(catalogue, "craft", request.craft());
        copyIfPresent(catalogue, "material", request.material());
        if (request.tags() != null) {
            catalogue.set("tags", objectMapper.valueToTree(request.tags()));
        }
        catalogue.put("id", "cat_" + id);
        catalogue.put("product_id", id);
        product.setCatalogue(catalogue);
        product.setStatus(ProductEntity.Status.READY);
        product.setProcessingStep("done");
        product.setProcessingProgress(100);
        cacheInvalidationService.productChanged(id);
    }

    @Transactional
    public PriceResponse recalculatePrice(String userId, boolean admin, String id, PriceRequest request) {
        ProductEntity product = findProduct(id);
        requireOwner(product, userId, admin);
        if (request.material_cost() < 50 || request.material_cost() > 200000
                || request.days_to_make() < 1 || request.days_to_make() > 365) {
            throw new ApiException("VALIDATION_ERROR", "Invalid pricing inputs.", HttpStatus.BAD_REQUEST);
        }
        double multiplier = switch (request.complexity()) {
            case "low" -> 1.15;
            case "medium" -> 1.28;
            case "high" -> 1.45;
            default -> throw new ApiException("VALIDATION_ERROR", "Invalid pricing inputs.", HttpStatus.BAD_REQUEST);
        };
        int dailyWage = 480;
        double suggested = Math.round((request.material_cost() + request.days_to_make() * dailyWage) * multiplier);
        double low = Math.round(suggested * 0.9);
        double high = Math.round(suggested * 1.15);
        String explanation = String.format(
                "Material ₹%.0f + %d artisan days at ₹%d/day, adjusted for %s complexity.",
                request.material_cost(), request.days_to_make(), dailyWage, request.complexity());
        ObjectNode price = objectMapper.createObjectNode();
        price.put("suggested_price", suggested);
        price.set("price_range", objectMapper.valueToTree(List.of(low, high)));
        price.put("explanation", explanation);
        ObjectNode pricing = objectMapper.createObjectNode();
        pricing.put("id", "prc_" + UUID.randomUUID());
        pricing.put("suggested_price", suggested);
        pricing.put("price_range_low", low);
        pricing.put("price_range_high", high);
        pricing.put("explanation", explanation);
        product.setMaterialCost(BigDecimal.valueOf(request.material_cost()));
        product.setPrice(price);
        product.setPricing(pricing);
        cacheInvalidationService.productChanged(id);
        return new PriceResponse(suggested, List.of(low, high), explanation);
    }

    @Transactional
    public ProductResponse patch(String userId, boolean admin, String id, ProductPatch patch) {
        ProductEntity product = findProduct(id);
        requireOwner(product, userId, admin);
        if ((patch.price() != null && !patch.price().isObject())
                || (patch.catalogue() != null && !patch.catalogue().isObject())) {
            throw new ApiException("VALIDATION_ERROR", "Invalid product update.", HttpStatus.BAD_REQUEST);
        }
        if (patch.price() != null) {
            product.setPrice(patch.price());
        }
        if (patch.catalogue() != null) {
            product.setCatalogue(patch.catalogue());
        }
        if (patch.status() != null) {
            product.setStatus(patch.status());
        }
        cacheInvalidationService.productChanged(id);
        return toResponse(product);
    }

    @Transactional
    public DeleteResponse delete(String userId, boolean admin, String id) {
        ProductEntity product = findProduct(id);
        requireOwner(product, userId, admin);
        productRepository.delete(product);
        cacheInvalidationService.productDeleted(id);
        return new DeleteResponse(true);
    }

    @Transactional(readOnly = true)
    public ProcessingStatusResponse processingStatus(String userId, boolean admin, String id) {
        ProductEntity product = findProduct(id);
        requireOwner(product, userId, admin);
        String step = product.getProcessingError() != null ? "failed"
                : product.getProcessingStep() == null ? "idle" : product.getProcessingStep();
        return new ProcessingStatusResponse(
                product.getId(), product.getStatus().name(), step, product.getProcessingProgress(),
                product.getProcessingError());
    }

    @Transactional
    public ImageUploadResponse uploadImage(String id, String userId, boolean admin, MultipartFile file) {
        ProductEntity product = findProduct(id);
        requireOwner(product, userId, admin);
        MediaContentValidator.ValidatedMedia validatedMedia = mediaContentValidator.validateImage(file);
        String imageUrl = saveMedia(product, ProductMediaEntity.MediaType.IMAGE, validatedMedia);
        cacheInvalidationService.productChanged(id);
        return new ImageUploadResponse(id, imageUrl);
    }

    @Transactional
    public AudioUploadResponse uploadAudio(String id, String userId, boolean admin, MultipartFile file) {
        ProductEntity product = findProduct(id);
        requireOwner(product, userId, admin);
        MediaContentValidator.ValidatedMedia validatedMedia = mediaContentValidator.validateAudio(file);
        String audioUrl = saveMedia(product, ProductMediaEntity.MediaType.AUDIO, validatedMedia);
        cacheInvalidationService.productChanged(id);
        return new AudioUploadResponse(id, audioUrl);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public ProcessingQueuedResponse process(String id, String userId, boolean admin, ProcessRequest request) {
        ProductEntity product = findProduct(id);
        requireOwner(product, userId, admin);
        ProductMediaEntity image = mediaRepository
                .findFirstByProduct_IdAndMediaTypeAndObjectKeyIsNotNullOrderByCreatedAtDesc(
                        id, ProductMediaEntity.MediaType.IMAGE)
                .orElseThrow(() -> new ApiException(
                        "IMAGE_REQUIRED",
                        "Upload an image to S3 before starting image enhancement.",
                        HttpStatus.BAD_REQUEST));

        product.setStatus(ProductEntity.Status.PROCESSING);
        product.setProcessingStep("queued_for_image_enhancement");
        product.setProcessingProgress(5);
        product.setProcessingError(null);
        if (request != null && request.transcript() != null && !request.transcript().isBlank()) {
            product.setHeritageStory(request.transcript());
        }
        productRepository.saveAndFlush(product);

        try {
            String jobId = imageEnhancementQueue.enqueue(id, image.getId(), image.getObjectKey());
            cacheInvalidationService.productChanged(id);
            return new ProcessingQueuedResponse(id, ProductEntity.Status.PROCESSING.name(), jobId);
        } catch (ApiException exception) {
            product.setStatus(ProductEntity.Status.FAILED);
            product.setProcessingStep("failed");
            product.setProcessingProgress(0);
            product.setProcessingError(exception.getMessage());
            productRepository.saveAndFlush(product);
            cacheInvalidationService.productChanged(id);
            throw exception;
        }
    }

    private ProductEntity findProduct(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Product not found", HttpStatus.NOT_FOUND));
    }

    private String saveMedia(
            ProductEntity product,
            ProductMediaEntity.MediaType mediaType,
            MediaContentValidator.ValidatedMedia file) {
        if (!mediaStorageService.isConfigured()) {
            throw new ApiException(
                    "SERVICE_UNAVAILABLE",
                    "Product media storage is temporarily unavailable.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
        String mediaId = UUID.randomUUID().toString();
        String objectKey = "products/" + product.getId() + "/" + mediaType.name().toLowerCase()
                + "/" + mediaId + "." + file.extension();
        boolean stored = false;
        try {
            mediaStorageService.putObject(objectKey, file.content(), file.contentType(), Map.of());
            stored = true;
            ProductMediaEntity media = new ProductMediaEntity(
                    mediaId, product, mediaType, null, file.contentType());
            media.setObjectKey(objectKey);
            mediaRepository.saveAndFlush(media);
            String mediaUrl = "/media/" + mediaId;
            if (mediaType == ProductMediaEntity.MediaType.IMAGE) {
                product.setImageUrl(mediaUrl);
                productRepository.saveAndFlush(product);
            }
            return mediaUrl;
        } catch (RuntimeException exception) {
            if (stored) {
                try {
                    mediaStorageService.deleteObject(objectKey);
                } catch (RuntimeException cleanupFailure) {
                    exception.addSuppressed(cleanupFailure);
                    logger.error("Could not remove media after a database failure.", cleanupFailure);
                }
            }
            throw exception;
        }
    }

    private static void requireOwner(ProductEntity product, String userId, boolean admin) {
        if (!admin && (product.getArtisan() == null || !product.getArtisan().getId().equals(userId))) {
            throw new ApiException("FORBIDDEN", "You do not own this product.", HttpStatus.FORBIDDEN);
        }
    }

    private ProductResponse toResponse(ProductEntity product) {
        List<ProductMediaEntity> media = mediaRepository.findAllByProduct_IdOrderByCreatedAtAsc(product.getId());
        List<MediaItem> images = new ArrayList<>();
        List<MediaItem> audio = new ArrayList<>();
        for (ProductMediaEntity item : media) {
            String url = item.getExternalUrl() == null ? "/media/" + item.getId() : item.getExternalUrl();
            MediaItem mediaItem = new MediaItem(item.getId(), url);
            (item.getMediaType() == ProductMediaEntity.MediaType.IMAGE ? images : audio).add(mediaItem);
        }
        List<OpportunityPreview> productOpportunities = opportunityRepository
                .findAllByProduct_IdOrderByCreatedAtDesc(product.getId()).stream()
                .map(item -> preview(item, "Verified Procurement Lead"))
                .toList();
        String artisanId = product.getArtisan() == null ? "" : product.getArtisan().getId();
        String imageUrl = images.isEmpty() ? product.getImageUrl() : images.get(0).url();
        return new ProductResponse(
                product.getId(), artisanId, product.getArtisanName(), product.getRegion(),
                product.getStatus().name(), product.getCreatedAt().toString(), imageUrl,
                images, audio, product.getHeritageStory(), product.getMoq(), product.getLeadTimeDays(),
                product.getCatalogue(), product.getPrice(), product.getPricing(), productOpportunities);
    }

    private static OpportunityPreview preview(OpportunityEntity item, String location) {
        String buyer = item.getCompanyName() == null || item.getCompanyName().isBlank()
                ? item.getBuyerName() : item.getCompanyName();
        return new OpportunityPreview(buyer, item.getMatchScore(), location, item.getRequirement());
    }

    private static void copyIfPresent(ObjectNode target, String field, String value) {
        if (value != null) {
            target.put(field, value);
        }
    }
}
