package com.kalasathi.controller;

import com.kalasathi.dto.ProductDtos.AudioUploadResponse;
import com.kalasathi.dto.ProductDtos.ImageUploadResponse;
import com.kalasathi.dto.ProductDtos.ProcessingQueuedResponse;
import com.kalasathi.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProductMediaControllerWebTest {
    private final ProductService productService = mock(ProductService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ProductController(productService)).build();
    }

    @Test
    void imageUploadMatchesExpressSuccessShape() throws Exception {
        when(productService.uploadImage(eq("prod_test"), eq("usr_test"), eq(false), any(MultipartFile.class)))
                .thenReturn(new ImageUploadResponse("prod_test", "/media/media_test"));
        MockMultipartFile file = new MockMultipartFile(
                "file", "image.png", MediaType.IMAGE_PNG_VALUE, new byte[] {1});

        mockMvc.perform(multipart("/api/products/prod_test/image")
                        .file(file)
                        .principal(artisanAuthentication()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.product_id").value("prod_test"))
                .andExpect(jsonPath("$.data.image_url").value("/media/media_test"))
                .andExpect(jsonPath("$.data.audio_url").doesNotExist());
    }

    @Test
    void audioUploadMatchesExpressSuccessShape() throws Exception {
        when(productService.uploadAudio(eq("prod_test"), eq("usr_test"), eq(false), any(MultipartFile.class)))
                .thenReturn(new AudioUploadResponse("prod_test", "/media/media_audio"));
        MockMultipartFile file = new MockMultipartFile(
                "file", "recording.mp3", "audio/mpeg", new byte[] {1});

        mockMvc.perform(multipart("/api/products/prod_test/audio")
                        .file(file)
                        .principal(artisanAuthentication()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.product_id").value("prod_test"))
                .andExpect(jsonPath("$.data.audio_url").value("/media/media_audio"))
                .andExpect(jsonPath("$.data.image_url").doesNotExist());
    }

    @Test
    void processReturnsAcceptedJobResponse() throws Exception {
        when(productService.process(eq("prod_test"), eq("usr_test"), eq(false), any()))
                .thenReturn(new ProcessingQueuedResponse("prod_test", "PROCESSING", "job_test"));

        mockMvc.perform(post("/api/products/prod_test/process")
                        .principal(artisanAuthentication())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"transcript\":\"Handwoven in Kutch\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.product_id").value("prod_test"))
                .andExpect(jsonPath("$.data.status").value("PROCESSING"))
                .andExpect(jsonPath("$.data.job_id").value("job_test"));
    }

    @Test
    void processingStatusReturnsProductErrorDetails() throws Exception {
        when(productService.processingStatus("usr_test", false, "prod_test"))
                .thenReturn(new com.kalasathi.dto.ProductDtos.ProcessingStatusResponse(
                        "prod_test", "FAILED", "failed", 0, "Provider is unavailable."));

        mockMvc.perform(get("/api/products/prod_test/processing-status")
                        .principal(artisanAuthentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.product_id").value("prod_test"))
                .andExpect(jsonPath("$.data.status").value("FAILED"))
                .andExpect(jsonPath("$.data.step").value("failed"))
                .andExpect(jsonPath("$.data.progress_percent").value(0))
                .andExpect(jsonPath("$.data.error").value("Provider is unavailable."));
    }

    private static UsernamePasswordAuthenticationToken artisanAuthentication() {
        return new UsernamePasswordAuthenticationToken(
                "usr_test", null, List.of(new SimpleGrantedAuthority("ROLE_ARTISAN")));
    }
}
