package com.kalasathi.repository;

import com.kalasathi.entity.ProductMediaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductMediaRepository extends JpaRepository<ProductMediaEntity, String> {
    List<ProductMediaEntity> findAllByProduct_IdOrderByCreatedAtAsc(String productId);

    Optional<ProductMediaEntity> findFirstByProduct_IdAndMediaTypeAndObjectKeyIsNotNullOrderByCreatedAtDesc(
            String productId, ProductMediaEntity.MediaType mediaType);
}
