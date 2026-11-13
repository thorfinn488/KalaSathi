package com.kalasathi.controller;

import com.kalasathi.dto.ApiResponse;
import com.kalasathi.entity.ProductMediaEntity;
import com.kalasathi.exception.ApiException;
import com.kalasathi.repository.ProductMediaRepository;
import com.kalasathi.service.S3MediaStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
public class MediaController {
    private final ProductMediaRepository mediaRepository;
    private final S3MediaStorageService mediaStorageService;

    public MediaController(ProductMediaRepository mediaRepository, S3MediaStorageService mediaStorageService) {
        this.mediaRepository = mediaRepository;
        this.mediaStorageService = mediaStorageService;
    }

    @GetMapping("/api/media/{id}")
    public ResponseEntity<?> getMedia(@PathVariable String id) {
        ProductMediaEntity media = mediaRepository.findById(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Media not found.", HttpStatus.NOT_FOUND));
        if (media.getExternalUrl() != null && !media.getExternalUrl().isBlank()) {
            return redirect(media.getExternalUrl());
        }
        if (media.getObjectKey() == null || media.getObjectKey().isBlank() || !mediaStorageService.isConfigured()) {
            throw new ApiException("MEDIA_UNAVAILABLE", "Stored media is unavailable.", HttpStatus.NOT_FOUND);
        }
        return redirect(mediaStorageService.createDownloadUrl(media.getObjectKey()));
    }

    private static ResponseEntity<?> redirect(String url) {
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }
}
