package com.kalasathi.dto;

import com.kalasathi.entity.UserEntity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Size(min = 2, message = "Name must be at least 2 characters") String name,
            @NotBlank @Size(min = 10, message = "Phone must be at least 10 digits") String phone,
            @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String password,
            @NotBlank String role,
            String region,
            String craft_specialty,
            String company_name,
            String requirements) {
    }

    public record LoginRequest(@NotBlank String phone, @NotBlank String password) {
    }

    public record AuthResponse(String user_id, String name, UserEntity.Role role, String token) {
        public static AuthResponse from(UserEntity user, String token) {
            return new AuthResponse(user.getId(), user.getName(), user.getRole(), token);
        }
    }

    public record UserResponse(String user_id, String name, UserEntity.Role role, String phone) {
        public static UserResponse from(UserEntity user) {
            return new UserResponse(user.getId(), user.getName(), user.getRole(), user.getPhone());
        }
    }
}
