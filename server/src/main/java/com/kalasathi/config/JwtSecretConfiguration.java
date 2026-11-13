package com.kalasathi.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.nio.charset.StandardCharsets;

@Configuration(proxyBeanMethods = false)
public class JwtSecretConfiguration {
    public JwtSecretConfiguration(@Value("${app.security.jwt-secret:}") String jwtSecret) {
        int secretLength = jwtSecret.getBytes(StandardCharsets.UTF_8).length;
        if (jwtSecret.isBlank() || secretLength < 32) {
            throw new IllegalStateException("JWT_SECRET must be set and contain at least 32 UTF-8 bytes.");
        }
    }
}
