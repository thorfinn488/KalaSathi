package com.kalasathi.repository;

import com.kalasathi.entity.OpportunityEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OpportunityRepository extends JpaRepository<OpportunityEntity, String> {
    List<OpportunityEntity> findAllByOrderByCreatedAtDesc();

    List<OpportunityEntity> findAllByProduct_IdOrderByCreatedAtDesc(String productId);
}
