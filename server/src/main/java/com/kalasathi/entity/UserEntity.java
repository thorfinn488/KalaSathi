package com.kalasathi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class UserEntity extends AuditableEntity {
    @Id
    @Column(name = "user_id", length = 64, nullable = false)
    private String id;

    @Column(name = "name", length = 255, nullable = false)
    private String name;

    @Column(name = "phone", length = 20, nullable = false, unique = true)
    private String phone;

    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20, nullable = false)
    private Role role;

    @Column(name = "region", length = 255)
    private String region;

    @Column(name = "craft_specialty", length = 255)
    private String craftSpecialty;

    @Column(name = "company_name", length = 255)
    private String companyName;

    @Column(name = "requirements", columnDefinition = "text")
    private String requirements;

    protected UserEntity() {
    }

    public UserEntity(String id, String name, String phone, String passwordHash, Role role) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getCraftSpecialty() {
        return craftSpecialty;
    }

    public void setCraftSpecialty(String craftSpecialty) {
        this.craftSpecialty = craftSpecialty;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getRequirements() {
        return requirements;
    }

    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }

    public enum Role {
        ARTISAN,
        ADMIN,
        BUYER
    }
}
