package com.kalasathi.controller;

import com.kalasathi.entity.ProductEntity;
import com.kalasathi.entity.ProductMediaEntity;
import com.kalasathi.repository.ProductMediaRepository;
import com.kalasathi.service.S3MediaStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MediaControllerWebTest {
    private final ProductMediaRepository mediaRepository = mock(ProductMediaRepository.class);
    private final S3MediaStorageService mediaStorageService = mock(S3MediaStorageService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
                new MediaController(mediaRepository, mediaStorageService)).build();
    }

    @Test
    void redirectsToFiveMinuteS3DownloadUrl() throws Exception {
        ProductEntity product = new ProductEntity("prod_test", null, null, ProductEntity.Status.READY);
        ProductMediaEntity media = new ProductMediaEntity(
                "media_test", product, ProductMediaEntity.MediaType.IMAGE, null, "image/jpeg");
        media.setObjectKey("products/prod_test/image/media_test.jpeg");
        when(mediaRepository.findById("media_test")).thenReturn(Optional.of(media));
        when(mediaStorageService.isConfigured()).thenReturn(true);
        when(mediaStorageService.createDownloadUrl(media.getObjectKey()))
                .thenReturn("https://bucket.s3.example.test/signed-object");

        mockMvc.perform(get("/api/media/media_test"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "https://bucket.s3.example.test/signed-object"));

        verify(mediaStorageService).createDownloadUrl(media.getObjectKey());
    }
}
