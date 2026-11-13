package com.kalasathi.security;

import com.kalasathi.entity.UserEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey signingKey;
    private final long expiryMinutes;

    public JwtService(
            @Value("${app.security.jwt-secret}") String secret,
            @Value("${app.security.jwt-expiry-minutes:1440}") long expiryMinutes) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        if (expiryMinutes <= 0) {
            throw new IllegalArgumentException("app.security.jwt-expiry-minutes must be greater than zero.");
        }
        this.expiryMinutes = expiryMinutes;
    }

    public String issue(UserEntity user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .claim("user_id", user.getId())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(Math.multiplyExact(expiryMinutes, 60))))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public String subjectUserId(String token) {
        Jws<Claims> signedClaims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token);
        if (!"HS256".equals(signedClaims.getHeader().getAlgorithm())) {
            throw new io.jsonwebtoken.JwtException("Unsupported JWT algorithm.");
        }
        Claims claims = signedClaims.getPayload();
        Object userId = claims.get("user_id");
        if (!(userId instanceof String id) || id.isBlank()) {
            throw new IllegalArgumentException("Token payload is invalid");
        }
        return id;
    }
}
