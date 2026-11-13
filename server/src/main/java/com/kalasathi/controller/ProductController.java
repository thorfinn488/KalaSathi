package com.kalasathi.controller;

import com.kalasathi.dto.ApiResponse;
import com.kalasathi.dto.ProductDtos;
import com.kalasathi.dto.ProductDtos.CatalogueRequest;
import com.kalasathi.dto.ProductDtos.CreateProductRequest;
import com.kalasathi.dto.ProductDtos.DeleteResponse;
import com.kalasathi.dto.ProductDtos.AudioUploadResponse;
import com.kalasathi.dto.ProductDtos.ImageUploadResponse;
import com.kalasathi.dto.ProductDtos.PriceRequest;
import com.kalasathi.dto.ProductDtos.PriceResponse;
import com.kalasathi.dto.ProductDtos.ProcessingQueuedResponse;
import com.kalasathi.dto.ProductDtos.ProcessingStatusResponse;
import com.kalasathi.dto.ProductDtos.ProductCreateResponse;
import com.kalasathi.dto.ProductDtos.ProductOpportunityResponse;
import com.kalasathi.dto.ProductDtos.ProductPatch;
import com.kalasathi.dto.ProductDtos.ProductResponse;
import com.kalasathi.dto.ProductDtos.ProcessRequest;
import com.kalasathi.service.ProductService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ApiResponse<List<ProductResponse>> list() {
        return ApiResponse.success(productService.list());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductCreateResponse>> create(
            Authentication authentication, @RequestBody(required = false) CreateProductRequest request) {
        boolean admin = hasRole(authentication, "ADMIN");
        String artisanId = request == null ? null : request.artisan_id();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                productService.createDraft(authentication.getName(), admin, artisanId)));
    }

    @GetMapping("/{id}/opportunities")
    public ApiResponse<ProductOpportunityResponse> opportunities(@PathVariable @NotBlank String id) {
        return ApiResponse.success(productService.opportunities(id));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> get(@PathVariable @NotBlank String id) {
        return ApiResponse.success(productService.get(id));
    }

    @PutMapping("/{id}/catalogue")
    public ApiResponse<ProductDtos.ProductUpdateResponse> updateCatalogue(
            Authentication authentication,
            @PathVariable @NotBlank String id,
            @Valid @RequestBody CatalogueRequest request) {
        productService.updateCatalogue(authentication.getName(), hasRole(authentication, "ADMIN"), id, request);
        return ApiResponse.success(new ProductDtos.ProductUpdateResponse(id, true));
    }

    @PostMapping("/{id}/recalculate-price")
    public ApiResponse<PriceResponse> recalculatePrice(
            Authentication authentication,
            @PathVariable @NotBlank String id,
            @Valid @RequestBody PriceRequest request) {
        return ApiResponse.success(productService.recalculatePrice(
                authentication.getName(), hasRole(authentication, "ADMIN"), id, request));
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadImage(
            Authentication authentication,
            @PathVariable @NotBlank String id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                productService.uploadImage(id, authentication.getName(), hasRole(authentication, "ADMIN"), file)));
    }

    @PostMapping(value = "/{id}/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AudioUploadResponse>> uploadAudio(
            Authentication authentication,
            @PathVariable @NotBlank String id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                productService.uploadAudio(id, authentication.getName(), hasRole(authentication, "ADMIN"), file)));
    }

    @PostMapping("/{id}/process")
    public ResponseEntity<ApiResponse<ProcessingQueuedResponse>> process(
            Authentication authentication,
            @PathVariable @NotBlank String id,
            @Valid @RequestBody(required = false) ProcessRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.success(
                productService.process(id, authentication.getName(), hasRole(authentication, "ADMIN"), request)));
    }

    @GetMapping("/{id}/processing-status")
    public ApiResponse<ProcessingStatusResponse> processingStatus(
            Authentication authentication, @PathVariable @NotBlank String id) {
        return ApiResponse.success(productService.processingStatus(
                authentication.getName(), hasRole(authentication, "ADMIN"), id));
    }

    @PatchMapping("/{id}")
    public ApiResponse<ProductResponse> patch(
            Authentication authentication,
            @PathVariable @NotBlank String id,
            @RequestBody ProductPatch patch) {
        return ApiResponse.success(productService.patch(
                authentication.getName(), hasRole(authentication, "ADMIN"), id, patch));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<DeleteResponse> delete(Authentication authentication, @PathVariable @NotBlank String id) {
        return ApiResponse.success(productService.delete(
                authentication.getName(), hasRole(authentication, "ADMIN"), id));
    }

    private static boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(value -> value.equals("ROLE_" + role));
    }
}
