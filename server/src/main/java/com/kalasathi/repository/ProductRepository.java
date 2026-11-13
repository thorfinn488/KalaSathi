package com.kalasathi.repository;

import com.kalasathi.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<ProductEntity, String> {
    List<ProductEntity> findAllByOrderByCreatedAtDesc();

    List<ProductEntity> findAllByArtisan_IdOrderByCreatedAtDesc(String artisanId);
}
