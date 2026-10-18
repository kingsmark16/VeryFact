package com.veryfact.common.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.veryfact.common.util.ImageValidator.ValidatedImage;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class ImageValidatorTest {

    private final ImageValidator validator = new ImageValidator();

    @Test
    void validateAndRead_whenValidJpegMagicBytes_returnsImageJpeg() {
        byte[] jpegBytes =
                new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 'J', 'F', 'I', 'F', 0, 1};
        MockMultipartFile file = new MockMultipartFile("images", "photo.jpg", "image/jpeg", jpegBytes);

        List<ValidatedImage> result = validator.validateAndRead(List.of(file));

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().mimeType()).isEqualTo("image/jpeg");
    }

    @Test
    void validateAndRead_whenFakeImageWithTextBytes_throwsIllegalArgumentException() {
        byte[] fakeBytes = "<!DOCTYPE html><script>alert(1)</script>".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("images", "evil.png", "image/png", fakeBytes);

        assertThatThrownBy(() -> validator.validateAndRead(List.of(file)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported image format");
    }
}
