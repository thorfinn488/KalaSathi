package com.kalasathi.controller;

import com.kalasathi.config.SecurityConfiguration;
import com.kalasathi.dto.AuthDtos.AuthResponse;
import com.kalasathi.entity.UserEntity;
import com.kalasathi.exception.ApiException;
import com.kalasathi.repository.UserRepository;
import com.kalasathi.security.JwtService;
import com.kalasathi.service.AuthService;
import com.kalasathi.service.AuthRateLimitService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AuthController.class,
        properties = "app.security.jwt-secret=phase-three-web-test-secret-0123456789")
@Import(SecurityConfiguration.class)
class AuthControllerWebTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private AuthRateLimitService authRateLimitService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserRepository userRepository;

    @Test
    void loginReturnsExpressSuccessEnvelope() throws Exception {
        when(authService.login(any())).thenReturn(
                new AuthResponse("usr_test", "Test User", UserEntity.Role.BUYER, "signed-token"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phone":"9811122233","password":"password123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user_id").value("usr_test"))
                .andExpect(jsonPath("$.data.name").value("Test User"))
                .andExpect(jsonPath("$.data.role").value("BUYER"))
                .andExpect(jsonPath("$.data.token").value("signed-token"))
                .andExpect(jsonPath("$.error").doesNotExist());
    }

    @Test
    void registerReturnsCreatedAuthEnvelope() throws Exception {
        when(authService.register(any())).thenReturn(
                new AuthResponse("usr_test", "Test Artisan", UserEntity.Role.ARTISAN, "signed-token"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Test Artisan",
                                  "phone":"9811122233",
                                  "password":"password123",
                                  "role":"ARTISAN"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user_id").value("usr_test"))
                .andExpect(jsonPath("$.data.role").value("ARTISAN"))
                .andExpect(jsonPath("$.data.token").value("signed-token"));
    }

    @Test
    void protectedRouteRejectsMissingToken() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("AUTH_REQUIRED"))
                .andExpect(jsonPath("$.error.message").value("Authentication token missing or invalid"));
    }

    @Test
    void loginReturnsTooManyRequestsWhenRateLimited() throws Exception {
        doThrow(new ApiException(
                "RATE_LIMITED",
                "Too many authentication attempts. Please try again later.",
                HttpStatus.TOO_MANY_REQUESTS))
                .when(authRateLimitService).checkAllowed("login", "127.0.0.1");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phone":"9811122233","password":"password123"}
                                """))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("RATE_LIMITED"));
    }

    @Test
    void loginReturnsServiceUnavailableWhenRateLimiterCannotReachRedis() throws Exception {
        doThrow(new ApiException(
                "SERVICE_UNAVAILABLE",
                "Authentication is temporarily unavailable. Please try again later.",
                HttpStatus.SERVICE_UNAVAILABLE))
                .when(authRateLimitService).checkAllowed("login", "127.0.0.1");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phone":"9811122233","password":"password123"}
                                """))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("SERVICE_UNAVAILABLE"))
                .andExpect(jsonPath("$.error.message")
                        .value("Authentication is temporarily unavailable. Please try again later."));
    }
}
