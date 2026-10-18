package com.veryfact.check;

import com.veryfact.check.domain.CheckStatus;
import com.veryfact.check.domain.FactCheck;
import com.veryfact.check.domain.FactCheckRepository;
import com.veryfact.check.domain.InputType;
import com.veryfact.check.dto.CheckAnalysisPayload;
import com.veryfact.check.dto.CheckResultDto;
import com.veryfact.check.dto.CreateCheckRequest;
import com.veryfact.check.dto.CreateCheckResponse;
import com.veryfact.common.exception.ResourceNotFoundException;
import com.veryfact.common.util.ContentHasher;
import com.veryfact.common.util.SlugGenerator;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CheckService {

    private static final Duration CACHE_TTL = Duration.ofDays(7);
    private static final int EXCERPT_MAX_LENGTH = 500;

    private final FactCheckRepository repository;
    private final ContentHasher contentHasher;
    private final SlugGenerator slugGenerator;
    private final CheckWorker checkWorker;

    public CheckService(
            FactCheckRepository repository,
            ContentHasher contentHasher,
            SlugGenerator slugGenerator,
            CheckWorker checkWorker) {
        this.repository = repository;
        this.contentHasher = contentHasher;
        this.slugGenerator = slugGenerator;
        this.checkWorker = checkWorker;
    }

    public CreateCheckResponse submitTextCheck(CreateCheckRequest request) {
        String text = request.text().trim();
        String hash = contentHasher.sha256Normalized(text);

        Optional<FactCheck> cached = repository
                .findFirstByContentHashAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
                        hash, CheckStatus.COMPLETED, Instant.now().minus(CACHE_TTL))
                .filter(existing -> existing.getModelVersion() == null
                        || !existing.getModelVersion().endsWith("-demo"));

        if (cached.isPresent()) {
            FactCheck existing = cached.get();
            return new CreateCheckResponse(existing.getSlug(), existing.getStatus(), existing.getStage(), true);
        }

        String slug = slugGenerator.generate();
        String excerpt = text.length() > EXCERPT_MAX_LENGTH ? text.substring(0, EXCERPT_MAX_LENGTH) + "..." : text;

        FactCheck check = new FactCheck(UUID.randomUUID(), slug, hash, InputType.TEXT, excerpt);
        repository.save(check);

        checkWorker.processTextCheckAsync(check.getId(), text);

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
}
