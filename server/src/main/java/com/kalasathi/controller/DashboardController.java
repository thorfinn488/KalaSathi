package com.kalasathi.controller;

import com.kalasathi.dto.ApiResponse;
import com.kalasathi.dto.DashboardDtos.Insights;
import com.kalasathi.dto.DashboardDtos.Summary;
import com.kalasathi.service.DashboardService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public ApiResponse<Summary> summary(Authentication authentication) {
        return ApiResponse.success(dashboardService.summary(authentication.getName()));
    }

    @GetMapping("/insights")
    public ApiResponse<Insights> insights() {
        return ApiResponse.success(dashboardService.insights());
    }
}
