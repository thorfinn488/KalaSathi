package com.kalasathi.service;

import com.kalasathi.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MediaContentValidatorTest {
    private final MediaContentValidator validator = new MediaContentValidator();

    @Test
    void detectsImageTypeFromFileSignatureInsteadOfClientContentType() {
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1};
        MockMultipartFile file = new MockMultipartFile("file", "image.bin", "image/jpeg", png);

        MediaContentValidator.ValidatedMedia validated = validator.validateImage(file);

        assertEquals("image/png", validated.contentType());
        assertEquals("png", validated.extension());
        assertArrayEquals(png, validated.content());
    }

    @Test
    void rejectsUnsupportedContentEvenWhenClientClaimsItIsAnImage() {
        MockMultipartFile file = new MockMultipartFile("file", "fake.jpg", "image/jpeg", new byte[] {1, 2, 3});

        ApiException exception = assertThrows(ApiException.class, () -> validator.validateImage(file));

        assertEquals("INVALID_MEDIA", exception.getCode());
    }

    @Test
    void rejectsAudioOnImageUpload() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "recording.wav", "image/png",
                new byte[] {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'A', 'V', 'E'});

        ApiException exception = assertThrows(ApiException.class, () -> validator.validateImage(file));

        assertEquals("INVALID_MEDIA", exception.getCode());
    }

    @Test
    void rejectsFilesOverFifteenMegabytes() {
        byte[] oversized = new byte[(int) MediaContentValidator.MAX_FILE_SIZE_BYTES + 1];
        oversized[0] = (byte) 0xFF;
        oversized[1] = (byte) 0xD8;
        oversized[2] = (byte) 0xFF;
        MockMultipartFile file = new MockMultipartFile("file", "large.jpg", "image/jpeg", oversized);

        ApiException exception = assertThrows(ApiException.class, () -> validator.validateImage(file));

        assertEquals("INVALID_MEDIA", exception.getCode());
    }
}
