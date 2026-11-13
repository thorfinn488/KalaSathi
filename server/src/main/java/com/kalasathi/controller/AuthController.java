package com.kalasathi.controller;

import com.kalasathi.dto.ApiResponse;
import com.kalasathi.dto.AuthDtos.AuthResponse;
import com.kalasathi.dto.AuthDtos.LoginRequest;
import com.kalasathi.dto.AuthDtos.RegisterRequest;
import com.kalasathi.dto.AuthDtos.UserResponse;
import com.kalasathi.service.AuthRateLimitService;
import com.kalasathi.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final AuthRateLimitService authRateLimitService;

    public AuthController(AuthService authService, AuthRateLimitService authRateLimitService) {
        this.authService = authService;
        this.authRateLimitService = authRateLimitService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest servletRequest) {
        authRateLimitService.checkAllowed("register", servletRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(authService.register(request)));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest) {
        authRateLimitService.checkAllowed("login", servletRequest.getRemoteAddr());
        return ApiResponse.success(authService.login(request));
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(Authentication authentication) {
        return ApiResponse.success(authService.currentUser(authentication.getName()));
    }
}
