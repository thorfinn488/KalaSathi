package com.kalasathi.service;

import com.kalasathi.dto.HealthResponse;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.time.Instant;

@Service
public class HealthService {
    public HealthResponse getHealth() {
        double uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000.0;
        return new HealthResponse("UP", uptimeSeconds, Instant.now());
    }
}
