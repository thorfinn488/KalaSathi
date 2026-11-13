package com.kalasathi.controller;

import com.kalasathi.dto.ApiResponse;
import com.kalasathi.dto.OpportunityDtos.OpportunityCreatedResponse;
import com.kalasathi.dto.OpportunityDtos.OpportunityListItem;
import com.kalasathi.dto.OpportunityDtos.OpportunityRequest;
import com.kalasathi.service.OpportunityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/opportunities")
public class OpportunityController {
    private final OpportunityService opportunityService;

    public OpportunityController(OpportunityService opportunityService) {
        this.opportunityService = opportunityService;
    }

    @GetMapping
    public ApiResponse<List<OpportunityListItem>> list() {
        return ApiResponse.success(opportunityService.list());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OpportunityCreatedResponse>> create(
            @Valid @RequestBody OpportunityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(opportunityService.create(request)));
    }
}
