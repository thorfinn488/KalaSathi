package com.kalasathi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_media")
public class ProductMediaEntity extends AuditableEntity {
    @Id
    @Column(name = "media_id", length = 64, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", length = 16, nullable = false)
    private MediaType mediaType;

    @Column(name = "object_key", columnDefinition = "text")
    private String objectKey;

    @Column(name = "external_url", columnDefinition = "text")
    private String externalUrl;

    @Column(name = "content_type", length = 255, nullable = false)
    private String contentType;

    protected ProductMediaEntity() {
    }

    public ProductMediaEntity(String id, ProductEntity product, MediaType mediaType, String externalUrl, String contentType) {
        this.id = id;
        this.product = product;
        this.mediaType = mediaType;
        this.externalUrl = externalUrl;
        this.contentType = contentType;
    }

    public String getId() {
        return id;
    }

    public ProductEntity getProduct() {
        return product;
    }

    public void setProduct(ProductEntity product) {
        this.product = product;
    }

    public MediaType getMediaType() {
        return mediaType;
    }

    public void setMediaType(MediaType mediaType) {
        this.mediaType = mediaType;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public void setObjectKey(String objectKey) {
        this.objectKey = objectKey;
    }

    public String getExternalUrl() {
        return externalUrl;
    }

    public void setExternalUrl(String externalUrl) {
        this.externalUrl = externalUrl;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public enum MediaType {
        IMAGE,
        AUDIO
    }
}
