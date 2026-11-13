package com.kalasathi.service;

import com.kalasathi.dto.AuthDtos.AuthResponse;
import com.kalasathi.dto.AuthDtos.LoginRequest;
import com.kalasathi.dto.AuthDtos.RegisterRequest;
import com.kalasathi.dto.AuthDtos.UserResponse;
import com.kalasathi.entity.UserEntity;
import com.kalasathi.exception.ApiException;
import com.kalasathi.repository.UserRepository;
import com.kalasathi.security.JwtService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        UserEntity.Role role;
        try {
            role = UserEntity.Role.valueOf(request.role());
        } catch (IllegalArgumentException exception) {
            throw new ApiException("VALIDATION_ERROR",
                    "Public registration is only available for ARTISAN or BUYER roles.", HttpStatus.BAD_REQUEST);
        }
        if (role == UserEntity.Role.ADMIN) {
            throw new ApiException("VALIDATION_ERROR",
                    "Public registration is only available for ARTISAN or BUYER roles.", HttpStatus.BAD_REQUEST);
        }
        if (userRepository.findByPhone(request.phone()).isPresent()) {
            throw new ApiException("USER_EXISTS", "An account with this phone number already exists", HttpStatus.CONFLICT);
        }

        UserEntity user = new UserEntity(
                "usr_" + UUID.randomUUID(),
                request.name(),
                request.phone(),
                passwordEncoder.encode(request.password()),
                role);
        user.setRegion(request.region());
        user.setCraftSpecialty(request.craft_specialty());
        user.setCompanyName(request.company_name());
        user.setRequirements(request.requirements());

        try {
            UserEntity saved = userRepository.saveAndFlush(user);
            return AuthResponse.from(saved, jwtService.issue(saved));
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException("USER_EXISTS", "An account with this phone number already exists", HttpStatus.CONFLICT);
        }
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByPhone(request.phone()).orElse(null);
        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException("INVALID_CREDENTIALS", "Invalid phone number or password", HttpStatus.UNAUTHORIZED);
        }
        return AuthResponse.from(user, jwtService.issue(user));
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(String userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User session not found", HttpStatus.UNAUTHORIZED));
        return UserResponse.from(user);
    }
}
