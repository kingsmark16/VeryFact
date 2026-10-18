package com.veryfact.check;

import com.veryfact.ai.FactCheckAi;
import com.veryfact.ai.FactCheckAi.AiVerificationOutput;
import com.veryfact.check.domain.CheckStage;
import com.veryfact.check.domain.CheckStatus;
import com.veryfact.check.domain.FactCheck;
import com.veryfact.check.domain.FactCheckRepository;
import com.veryfact.check.dto.CheckAnalysisPayload;
import com.veryfact.check.dto.FactCheckMatchDto;
import com.veryfact.common.util.ImageValidator.ValidatedImage;
import com.veryfact.extractor.ArticleExtractor;
import com.veryfact.factcheck.FactCheckToolsClient;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class CheckWorker {

    private static final Logger log = LoggerFactory.getLogger(CheckWorker.class);

    private final FactCheckRepository repository;
    private final ArticleExtractor articleExtractor;
    private final FactCheckToolsClient factCheckToolsClient;
    private final FactCheckAi factCheckAi;

    public CheckWorker(
            FactCheckRepository repository,
            ArticleExtractor articleExtractor,
            FactCheckToolsClient factCheckToolsClient,
            FactCheckAi factCheckAi) {
        this.repository = repository;
        this.articleExtractor = articleExtractor;
        this.factCheckToolsClient = factCheckToolsClient;
        this.factCheckAi = factCheckAi;
    }

    @Async
    public void processTextCheckAsync(UUID checkId, String fullText) {
        processSubmissionAsync(checkId, fullText, null, List.of());
    }

    @Async
    public void processSubmissionAsync(UUID checkId, String text, String url, List<ValidatedImage> images) {
        FactCheck check = repository.findById(checkId).orElse(null);
        if (check == null) {
            return;
        }

        try {
            check.setStatus(CheckStatus.PROCESSING);
            check.setStage(CheckStage.EXTRACTING_CLAIMS);
            repository.save(check);

            String combinedText = text != null ? text.trim() : "";
            if (url != null && !url.isBlank()) {
                String extracted = articleExtractor.extractTextFromUrl(url);
                combinedText = combinedText.isBlank() ? extracted : combinedText + "\n\n" + extracted;
            }

            check.setStage(CheckStage.SEARCHING_FACT_CHECKS);
            repository.save(check);

            List<FactCheckMatchDto> factChecks =
                    combinedText.isBlank() ? List.of() : factCheckToolsClient.searchClaims(combinedText);

            check.setStage(CheckStage.VERIFYING_CLAIMS);
            repository.save(check);

            AiVerificationOutput output =
                    factCheckAi.analyzeSubmission(combinedText, images != null ? images : List.of(), factChecks);

            check.setLanguage(output.language());
            check.setOverallVerdict(output.overallVerdict());
            check.setConfidence(output.confidence());
            check.setSummary(output.summary());
            check.setResultJson(new CheckAnalysisPayload(output.claims(), output.redFlags()));
            check.setModelVersion(output.modelVersion());
            check.setStatus(CheckStatus.COMPLETED);
            check.setStage(CheckStage.COMPLETED);
            check.setCompletedAt(Instant.now());
            repository.save(check);
        } catch (IllegalArgumentException ex) {
            log.warn("Check validation/extraction failed for id={}: {}", checkId, ex.getMessage());
            check.setStatus(CheckStatus.FAILED);
            check.setStage(CheckStage.FAILED);
            check.setErrorMessage(ex.getMessage());
            check.setCompletedAt(Instant.now());
            repository.save(check);
        } catch (Exception ex) {
            log.error("Fact check failed for id={}", checkId, ex);
            check.setStatus(CheckStatus.FAILED);
            check.setStage(CheckStage.FAILED);
            check.setErrorMessage("Verification failed. Please try again later.");
            check.setCompletedAt(Instant.now());
            repository.save(check);
        }
    }
}
