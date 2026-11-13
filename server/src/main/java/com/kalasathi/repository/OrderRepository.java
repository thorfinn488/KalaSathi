package com.kalasathi.repository;

import com.kalasathi.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<OrderEntity, String> {
    List<OrderEntity> findAllByCustomerPhoneOrderByCreatedAtDesc(String customerPhone);

    List<OrderEntity> findAllByOrderByCreatedAtDesc();

    List<OrderEntity> findAllByRazorpayOrderId(String razorpayOrderId);

    java.util.Optional<OrderEntity> findFirstByRazorpayOrderId(String razorpayOrderId);
}
