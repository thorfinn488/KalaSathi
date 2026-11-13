package com.kalasathi.service;

import com.kalasathi.dto.AuthDtos.LoginRequest;
import com.kalasathi.dto.AuthDtos.RegisterRequest;
import com.kalasathi.entity.UserEntity;
import com.kalasathi.exception.ApiException;
import com.kalasathi.repository.UserRepository;
import com.kalasathi.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    void registersUserWithBcryptAndIssuesToken() {
        RegisterRequest request = new RegisterRequest(
                "Test Artisan", "9811122233", "password123", "ARTISAN",
                "Bihar", "Painting", null, null);
        when(userRepository.findByPhone(request.phone())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(request.password())).thenReturn("$2a$10$encoded");
        when(userRepository.saveAndFlush(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.issue(any(UserEntity.class))).thenReturn("jwt-token");

        var response = authService.register(request);

        assertEquals("Test Artisan", response.name());
        assertEquals(UserEntity.Role.ARTISAN, response.role());
        assertEquals("jwt-token", response.token());
        verify(passwordEncoder).encode(request.password());
    }

    @Test
    void rejectsLoginWhenPasswordDoesNotMatch() {
        UserEntity user = new UserEntity(
                "usr_test", "Test Artisan", "9811122233", "$2a$10$existing", UserEntity.Role.ARTISAN);
        when(userRepository.findByPhone("9811122233")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", user.getPasswordHash())).thenReturn(false);

        ApiException exception = assertThrows(ApiException.class,
                () -> authService.login(new LoginRequest("9811122233", "wrong-password")));

        assertEquals("INVALID_CREDENTIALS", exception.getCode());
        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
    }

    @Test
    void rejectsDuplicatePhone() {
        UserEntity existing = new UserEntity(
                "usr_existing", "Existing User", "9811122233", "hash", UserEntity.Role.ARTISAN);
        when(userRepository.findByPhone(existing.getPhone())).thenReturn(Optional.of(existing));

        ApiException exception = assertThrows(ApiException.class,
                () -> authService.register(new RegisterRequest(
                        "Test Artisan", existing.getPhone(), "password123", "ARTISAN",
                        null, null, null, null)));

        assertEquals("USER_EXISTS", exception.getCode());
        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
    }
}
