package com.kalasathi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "opportunities")
public class OpportunityEntity extends AuditableEntity {
    @Id
    @Column(name = "opportunity_id", length = 64, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private ProductEntity product;

    @Column(name = "buyer_name", length = 255, nullable = false)
    private String buyerName;

    @Column(name = "buyer_contact", length = 255)
    private String buyerContact;

    @Column(name = "company_name", length = 255)
    private String companyName;

    @Column(name = "match_score")
    private Integer matchScore = 90;

    @Column(name = "status", length = 20)
    private String status = "ACTIVE";

    @Column(name = "requirement", columnDefinition = "text", nullable = false)
    private String requirement;

    @Column(name = "quantity")
    private Integer quantity = 50;

    @Column(name = "budget", length = 100)
    private String budget;

    protected OpportunityEntity() {
    }

    public OpportunityEntity(String id, ProductEntity product, String buyerName, String requirement) {
        this.id = id;
        this.product = product;
        this.buyerName = buyerName;
        this.requirement = requirement;
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

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public String getBuyerContact() {
        return buyerContact;
    }

    public void setBuyerContact(String buyerContact) {
        this.buyerContact = buyerContact;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public Integer getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(Integer matchScore) {
        this.matchScore = matchScore;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRequirement() {
        return requirement;
    }

    public void setRequirement(String requirement) {
        this.requirement = requirement;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getBudget() {
        return budget;
    }

    public void setBudget(String budget) {
        this.budget = budget;
    }
}
