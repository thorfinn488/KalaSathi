package com.kalasathi.controller;

import com.kalasathi.dto.AdminDtos.Artisan;
import com.kalasathi.dto.AdminDtos.Opportunity;
import com.kalasathi.dto.AdminDtos.Product;
import com.kalasathi.dto.ApiResponse;
import com.kalasathi.service.AdminService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/artisans")
    public ApiResponse<List<Artisan>> artisans() {
        return ApiResponse.success(adminService.artisans());
    }

    @GetMapping("/products")
    public ApiResponse<List<Product>> products() {
        return ApiResponse.success(adminService.products());
    }

    @GetMapping("/opportunities")
    public ApiResponse<List<Opportunity>> opportunities() {
        return ApiResponse.success(adminService.opportunities());
    }
}
