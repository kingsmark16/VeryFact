package com.veryfact.common.util;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class ImageValidator {

    private static final int MAX_IMAGES = 4;
    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;

    public record ValidatedImage(byte[] bytes, String mimeType) {}

    public List<ValidatedImage> validateAndRead(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        List<MultipartFile> nonEmpty =
                files.stream().filter(f -> f != null && !f.isEmpty()).toList();
        if (nonEmpty.isEmpty()) {
            return List.of();
        }

        if (nonEmpty.size() > MAX_IMAGES) {
            throw new IllegalArgumentException("A maximum of " + MAX_IMAGES + " images can be uploaded per check.");
        }

        List<ValidatedImage> validated = new ArrayList<>(nonEmpty.size());
        for (MultipartFile file : nonEmpty) {
            if (file.getSize() > MAX_IMAGE_BYTES) {
                throw new IllegalArgumentException("Each image must be 5 MB or smaller.");
            }
            byte[] bytes;
            try {
                bytes = file.getBytes();
            } catch (IOException ex) {
                throw new IllegalArgumentException("Could not read uploaded image file.");
            }
            String mimeType = detectAllowedMimeType(bytes);
            validated.add(new ValidatedImage(bytes, mimeType));
        }

        return validated;
    }

    String detectAllowedMimeType(byte[] bytes) {
        if (bytes == null || bytes.length < 12) {
            throw new IllegalArgumentException("Unsupported image format. Allowed formats: JPEG, PNG, WebP.");
        }

        // JPEG: FF D8 FF
        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((bytes[0] & 0xFF) == 0x89
                && bytes[1] == 0x50
                && bytes[2] == 0x4E
                && bytes[3] == 0x47
                && bytes[4] == 0x0D
                && bytes[5] == 0x0A
                && bytes[6] == 0x1A
                && bytes[7] == 0x0A) {
            return "image/png";
        }

        // WebP: "RIFF" (0..3) and "WEBP" (8..11)
        if (bytes[0] == 'R'
                && bytes[1] == 'I'
                && bytes[2] == 'F'
                && bytes[3] == 'F'
                && bytes[8] == 'W'
                && bytes[9] == 'E'
                && bytes[10] == 'B'
                && bytes[11] == 'P') {
            return "image/webp";
        }

        throw new IllegalArgumentException("Unsupported image format. Allowed formats: JPEG, PNG, WebP.");
    }
}
