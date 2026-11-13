package com.kalasathi.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kalasathi.dto.ProductDtos.ProductResponse;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.RedisSerializer;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

class RedisCacheConfigurationTest {
    private final RedisSerializer<Object> serializer = RedisCacheConfiguration.cacheValueSerializer();

    @Test
    void serializerRoundTripsEmptyLists() {
        Object restored = serializer.deserialize(serializer.serialize(List.of()));

        assertInstanceOf(List.class, restored);
        assertEquals(List.of(), restored);
    }

    @Test
    void serializerRoundTripsProductResponses() {
        ProductResponse response = new ProductResponse(
                "prod_test", "usr_test", "Test Artisan", "Kutch", "READY", "2026-01-01T00:00:00Z",
                null, List.of(), List.of(), null, 1, 14,
                new ObjectMapper().createObjectNode(), null, null, List.of());

        Object restored = serializer.deserialize(serializer.serialize(response));

        assertInstanceOf(ProductResponse.class, restored);
        assertEquals(response.toString(), restored.toString());
    }
}
