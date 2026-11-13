package com.kalasathi.service;

import com.kalasathi.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class MediaContentValidator {
    public static final long MAX_FILE_SIZE_BYTES = 15L * 1024 * 1024;

    public ValidatedMedia validateImage(MultipartFile file) {
        return validate(file, Kind.IMAGE);
    }

    public ValidatedMedia validateAudio(MultipartFile file) {
        return validate(file, Kind.AUDIO);
    }

    private static ValidatedMedia validate(MultipartFile file, Kind kind) {
        String invalidMessage = kind == Kind.IMAGE
                ? "Upload a JPEG, PNG, or WebP product image."
                : "Upload a supported MP3, MP4, WAV, or WebM audio recording.";
        if (file == null || file.isEmpty() || file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw invalidMedia(invalidMessage);
        }

        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException exception) {
            throw new ApiException("INVALID_MEDIA", "Unable to read the uploaded file.", HttpStatus.BAD_REQUEST);
        }

        String contentType = detectContentType(content);
        boolean validType = contentType != null && (kind == Kind.IMAGE
                ? contentType.startsWith("image/")
                : contentType.startsWith("audio/"));
        if (!validType) {
            throw invalidMedia(invalidMessage);
        }
        return new ValidatedMedia(content, contentType, extension(contentType));
    }

    private static String detectContentType(byte[] content) {
        if (matches(content, 0, new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF})) {
            return "image/jpeg";
        }
        if (matches(content, 0, new byte[] {
                (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A})) {
            return "image/png";
        }
        if (content.length >= 12
                && matchesText(content, 0, "RIFF")
                && matchesText(content, 8, "WEBP")) {
            return "image/webp";
        }
        if (content.length >= 12
                && matchesText(content, 0, "RIFF")
                && matchesText(content, 8, "WAVE")) {
            return "audio/wav";
        }
        if (content.length >= 8 && matchesText(content, 4, "ftyp")) {
            return "audio/mp4";
        }
        if (matches(content, 0, new byte[] {0x1A, 0x45, (byte) 0xDF, (byte) 0xA3})) {
            return "audio/webm";
        }
        if (content.length >= 3 && matchesText(content, 0, "ID3")) {
            return "audio/mpeg";
        }
        if (content.length >= 2 && (content[0] & 0xFF) == 0xFF && (content[1] & 0xE0) == 0xE0) {
            return "audio/mpeg";
        }
        return null;
    }

    private static boolean matches(byte[] content, int offset, byte[] signature) {
        if (content.length < offset + signature.length) {
            return false;
        }
        for (int index = 0; index < signature.length; index++) {
            if (content[offset + index] != signature[index]) {
                return false;
            }
        }
        return true;
    }

    private static boolean matchesText(byte[] content, int offset, String expected) {
        return content.length >= offset + expected.length()
                && new String(content, offset, expected.length(), StandardCharsets.US_ASCII).equals(expected);
    }

    private static String extension(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> "jpeg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "audio/mpeg" -> "mpeg";
            case "audio/mp4" -> "mp4";
            case "audio/wav" -> "wav";
            case "audio/webm" -> "webm";
            default -> throw new IllegalArgumentException("Unsupported validated media type.");
        };
    }

    private static ApiException invalidMedia(String message) {
        return new ApiException("INVALID_MEDIA", message, HttpStatus.BAD_REQUEST);
    }

    public record ValidatedMedia(byte[] content, String contentType, String extension) {
    }

    private enum Kind {
        IMAGE,
        AUDIO
    }
}
