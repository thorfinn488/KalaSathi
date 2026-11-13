package com.kalasathi.dto;

import java.time.Instant;

public record HealthResponse(String status, double uptime, Instant timestamp) {
}
