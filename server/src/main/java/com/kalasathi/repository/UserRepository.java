package com.kalasathi.repository;

import com.kalasathi.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<UserEntity, String> {
    Optional<UserEntity> findByPhone(String phone);

    List<UserEntity> findAllByRoleOrderByCreatedAtDesc(UserEntity.Role role);
}
