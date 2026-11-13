package com.kalasathi.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class ProductEntity extends AuditableEntity {
    @Id
    @Column(name = "product_id", length = 64, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artisan_id")
    private UserEntity artisan;

    @Column(name = "artisan_name", length = 255)
    private String artisanName;

    @Column(name = "region", length = 255)
    private String region;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private Status status = Status.READY;

    @Column(name = "image_url", columnDefinition = "text")
    private String imageUrl;

    @Column(name = "heritage_story", columnDefinition = "text")
    private String heritageStory;

    @Column(name = "moq")
    private Integer moq = 10;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays = 14;

    @Column(name = "stock", nullable = false)
    private Integer stock = 0;

    @Column(name = "low_stock_threshold", nullable = false)
    private Integer lowStockThreshold = 10;

    @Column(name = "material_cost", precision = 10, scale = 2, nullable = false)
    private BigDecimal materialCost = BigDecimal.ZERO;

    @Column(name = "processing_step", length = 255)
    private String processingStep;

    @Column(name = "processing_progress", nullable = false)
    private Integer processingProgress = 0;

    @Column(name = "processing_error", columnDefinition = "text")
    private String processingError;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "catalogue", columnDefinition = "jsonb")
    private JsonNode catalogue;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "price", columnDefinition = "jsonb")
    private JsonNode price;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "pricing", columnDefinition = "jsonb")
    private JsonNode pricing;

    protected ProductEntity() {
    }

    public ProductEntity(String id, UserEntity artisan, String artisanName, Status status) {
        this.id = id;
        this.artisan = artisan;
        this.artisanName = artisanName;
        this.status = status;
    }

    public String getId() {
        return id;
    }

    public UserEntity getArtisan() {
        return artisan;
    }

    public void setArtisan(UserEntity artisan) {
        this.artisan = artisan;
    }

    public String getArtisanName() {
        return artisanName;
    }

    public void setArtisanName(String artisanName) {
        this.artisanName = artisanName;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getHeritageStory() {
        return heritageStory;
    }

    public void setHeritageStory(String heritageStory) {
        this.heritageStory = heritageStory;
    }

    public Integer getMoq() {
        return moq;
    }

    public void setMoq(Integer moq) {
        this.moq = moq;
    }

    public Integer getLeadTimeDays() {
        return leadTimeDays;
    }

    public void setLeadTimeDays(Integer leadTimeDays) {
        this.leadTimeDays = leadTimeDays;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public Integer getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(Integer lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }

    public BigDecimal getMaterialCost() {
        return materialCost;
    }

    public void setMaterialCost(BigDecimal materialCost) {
        this.materialCost = materialCost;
    }

    public String getProcessingStep() {
        return processingStep;
    }

    public void setProcessingStep(String processingStep) {
        this.processingStep = processingStep;
    }

    public Integer getProcessingProgress() {
        return processingProgress;
    }

    public void setProcessingProgress(Integer processingProgress) {
        this.processingProgress = processingProgress;
    }

    public String getProcessingError() {
        return processingError;
    }

    public void setProcessingError(String processingError) {
        this.processingError = processingError;
    }

    public JsonNode getCatalogue() {
        return catalogue;
    }

    public void setCatalogue(JsonNode catalogue) {
        this.catalogue = catalogue;
    }

    public JsonNode getPrice() {
        return price;
    }

    public void setPrice(JsonNode price) {
        this.price = price;
    }

    public JsonNode getPricing() {
        return pricing;
    }

    public void setPricing(JsonNode pricing) {
        this.pricing = pricing;
    }

    public enum Status {
        DRAFT,
        PROCESSING,
        READY,
        PUBLISHED,
        FAILED
    }
}
