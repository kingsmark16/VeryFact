package com.veryfact.check;

import com.veryfact.check.domain.CheckStatus;
import com.veryfact.check.domain.FactCheck;
import com.veryfact.check.domain.FactCheckRepository;
import com.veryfact.check.domain.InputType;
import com.veryfact.check.dto.CheckAnalysisPayload;
import com.veryfact.check.dto.CheckResultDto;
import com.veryfact.check.dto.CreateCheckRequest;
import com.veryfact.check.dto.CreateCheckResponse;
import com.veryfact.check.dto.RecentCheckDto;
import com.veryfact.common.exception.ResourceNotFoundException;
import com.veryfact.common.util.ContentHasher;
import com.veryfact.common.util.ImageValidator;
import com.veryfact.common.util.ImageValidator.ValidatedImage;
import com.veryfact.common.util.SlugGenerator;
import com.veryfact.extractor.SsrfGuard;
import java.net.URI;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CheckService {

    private static final Duration CACHE_TTL = Duration.ofDays(7);
    private static final int EXCERPT_MAX_LENGTH = 500;
    private static final int MAX_TEXT_LENGTH = 20_000;

    private final FactCheckRepository repository;
    private final ContentHasher contentHasher;
    private final SlugGenerator slugGenerator;
    private final ImageValidator imageValidator;
    private final SsrfGuard ssrfGuard;
    private final CheckWorker checkWorker;

    public CheckService(
            FactCheckRepository repository,
            ContentHasher contentHasher,
            SlugGenerator slugGenerator,
            ImageValidator imageValidator,
            SsrfGuard ssrfGuard,
            CheckWorker checkWorker) {
        this.repository = repository;
        this.contentHasher = contentHasher;
        this.slugGenerator = slugGenerator;
        this.imageValidator = imageValidator;
        this.ssrfGuard = ssrfGuard;
        this.checkWorker = checkWorker;
    }

    public CreateCheckResponse submitTextCheck(CreateCheckRequest request) {
        String text = request.text().trim();
        String hash = contentHasher.sha256Normalized(text);

        Optional<FactCheck> cached = findValidCached(hash);
        if (cached.isPresent()) {
            FactCheck existing = cached.get();
            return new CreateCheckResponse(existing.getSlug(), existing.getStatus(), existing.getStage(), true);
        }

        String slug = slugGenerator.generate();
        String excerpt = buildExcerpt(text);

        FactCheck check = new FactCheck(UUID.randomUUID(), slug, hash, InputType.TEXT, excerpt);
        repository.save(check);

        checkWorker.processTextCheckAsync(check.getId(), text);

        return new CreateCheckResponse(check.getSlug(), check.getStatus(), check.getStage(), false);
    }

    public CreateCheckResponse submitMultipartCheck(String rawText, String rawUrl, List<MultipartFile> imageFiles) {
        String text = rawText != null ? rawText.trim() : "";
        String url = rawUrl != null ? rawUrl.trim() : "";
        List<ValidatedImage> validatedImages = imageValidator.validateAndRead(imageFiles);

        boolean hasText = !text.isBlank();
        boolean hasUrl = !url.isBlank();
        boolean hasImages = !validatedImages.isEmpty();

        if (!hasText && !hasUrl && !hasImages) {
            throw new IllegalArgumentException("Provide text (at least 20 characters), a URL, or at least one image.");
        }

        if (hasText && !hasUrl && !hasImages && text.length() < 20) {
            throw new IllegalArgumentException("Text must be at least 20 characters long.");
        }

        if (text.length() > MAX_TEXT_LENGTH) {
            throw new IllegalArgumentException("Text must not exceed 20,000 characters.");
        }

        String normalizedUrl = null;
        if (hasUrl) {
            URI safeUri = ssrfGuard.validatePublicHttpUri(url);
            normalizedUrl = safeUri.toString();
        }

        InputType inputType = resolveInputType(hasText, hasUrl, hasImages);
        String hash = computeMultipartHash(text, normalizedUrl, validatedImages);

        Optional<FactCheck> cached = findValidCached(hash);
        if (cached.isPresent()) {
            FactCheck existing = cached.get();
            return new CreateCheckResponse(existing.getSlug(), existing.getStatus(), existing.getStage(), true);
        }

        String slug = slugGenerator.generate();
        String excerpt = hasText
                ? buildExcerpt(text)
                : hasUrl ? normalizedUrl : "Uploaded " + validatedImages.size() + " image(s)";

        FactCheck check = new FactCheck(UUID.randomUUID(), slug, hash, inputType, excerpt);
        check.setSourceUrl(normalizedUrl);
        repository.save(check);

        checkWorker.processSubmissionAsync(check.getId(), text, normalizedUrl, validatedImages);

        return new CreateCheckResponse(check.getSlug(), check.getStatus(), check.getStage(), false);
    }

    public CheckResultDto getBySlug(String slug) {
        FactCheck check = repository
                .findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Check result not found: " + slug));

        CheckAnalysisPayload payload = check.getResultJson();
        return new CheckResultDto(
                check.getSlug(),
                check.getInputType(),
                check.getSourceUrl(),
                check.getInputExcerpt(),
                check.getLanguage(),
                check.getStatus(),
                check.getStage(),
                check.getOverallVerdict(),
                check.getConfidence(),
                check.getSummary(),
                payload != null && payload.claims() != null ? payload.claims() : List.of(),
                payload != null && payload.redFlags() != null ? payload.redFlags() : List.of(),
                check.getErrorMessage(),
                check.getModelVersion(),
                check.getCreatedAt(),
                check.getCompletedAt());
    }

    public List<RecentCheckDto> getRecentChecks() {
        return repository.findTop6ByStatusAndOverallVerdictIsNotNullOrderByCreatedAtDesc(CheckStatus.COMPLETED).stream()
                .map(check -> new RecentCheckDto(
                        check.getSlug(),
                        check.getInputType(),
                        check.getInputExcerpt(),
                        check.getOverallVerdict(),
                        check.getConfidence(),
                        check.getSummary(),
                        check.getCreatedAt()))
                .toList();
    }

    private Optional<FactCheck> findValidCached(String hash) {
        return repository
                .findFirstByContentHashAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
                        hash, CheckStatus.COMPLETED, Instant.now().minus(CACHE_TTL))
                .filter(existing -> existing.getModelVersion() == null
                        || !existing.getModelVersion().endsWith("-demo"));
    }

    private InputType resolveInputType(boolean hasText, boolean hasUrl, boolean hasImages) {
        int count = (hasText ? 1 : 0) + (hasUrl ? 1 : 0) + (hasImages ? 1 : 0);
        if (count > 1) {
            return InputType.MIXED;
        }
        if (hasUrl) {
            return InputType.URL;
        }
        if (hasImages) {
            return InputType.IMAGE;
        }
        return InputType.TEXT;
    }

    private String computeMultipartHash(String text, String normalizedUrl, List<ValidatedImage> images) {
        StringBuilder seed = new StringBuilder();
        if (!text.isBlank()) {
            seed.append("text:").append(contentHasher.sha256Normalized(text)).append("|");
        }
        if (normalizedUrl != null) {
            seed.append("url:").append(normalizedUrl).append("|");
        }
        for (ValidatedImage img : images) {
            seed.append("img:").append(sha256Bytes(img.bytes())).append("|");
        }
        return contentHasher.sha256Normalized(seed.toString());
    }

    private String sha256Bytes(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(bytes));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }

    private String buildExcerpt(String text) {
        return text.length() > EXCERPT_MAX_LENGTH ? text.substring(0, EXCERPT_MAX_LENGTH) + "..." : text;
    }
}
