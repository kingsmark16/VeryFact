package com.veryfact.check;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.veryfact.ai.FactCheckAi;
import com.veryfact.ai.VerificationModelUnavailableException;
import com.veryfact.ai.VerificationTimeoutException;
import com.veryfact.check.domain.*;
import com.veryfact.extractor.ArticleExtractor;
import com.veryfact.factcheck.FactCheckToolsClient;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

class CheckWorkerTest {
    @org.junit.jupiter.api.Test
    void diagnosticReasonsUseOnlyKnownApplicationMessages() {
        assertThat(CheckWorker.failureReason(
                        new IllegalStateException("Verification cited a source absent from Google results")))
                .isEqualTo("UNRECOGNIZED_CITATION");
        assertThat(CheckWorker.failureReason(new IllegalStateException("Gemini response did not complete")))
                .isEqualTo("INCOMPLETE_MODEL_RESPONSE");
        assertThat(CheckWorker.failureReason(new IllegalStateException("Private submission and API key")))
                .isEqualTo("UNKNOWN_FAILURE");
        assertThat(CheckWorker.failureReason(new IllegalStateException())).isEqualTo("UNKNOWN_FAILURE");
        assertThat(CheckWorker.failureReason(new RuntimeException("Private submission and API key")))
                .isEqualTo("PROVIDER_OR_OTHER_FAILURE");
    }

    @org.junit.jupiter.api.Test
    void unavailableModelGetsAnActionableFailure() {
        FactCheckRepository repository = mock(FactCheckRepository.class);
        FactCheckAi ai = mock(FactCheckAi.class);
        FactCheckToolsClient factChecks = mock(FactCheckToolsClient.class);
        FactCheck check = new FactCheck(UUID.randomUUID(), "testSlug02", "hash", InputType.TEXT, "claim");
        when(repository.findById(check.getId())).thenReturn(Optional.of(check));
        when(factChecks.searchClaims(any())).thenReturn(List.of());
        when(ai.analyzeSubmission(any(), any(), any())).thenThrow(new VerificationModelUnavailableException());

        new CheckWorker(repository, mock(ArticleExtractor.class), factChecks, ai)
                .processTextCheckAsync(check.getId(), "A factual claim.");

        assertThat(check.getStatus()).isEqualTo(CheckStatus.FAILED);
        assertThat(check.getErrorMessage()).contains("model is unavailable").doesNotContain("quota");
    }

    @org.junit.jupiter.params.ParameterizedTest
    @org.junit.jupiter.params.provider.ValueSource(booleans = {false, true})
    void searchFailureIsPersistedAsFailureWithoutInventingVerdictsOrLeakingProviderErrors(boolean timeout) {
        FactCheckRepository repository = mock(FactCheckRepository.class);
        FactCheckAi ai = mock(FactCheckAi.class);
        FactCheckToolsClient factChecks = mock(FactCheckToolsClient.class);
        FactCheck check = new FactCheck(UUID.randomUUID(), "testSlug01", "hash", InputType.TEXT, "claim");
        when(repository.findById(check.getId())).thenReturn(Optional.of(check));
        when(factChecks.searchClaims(any())).thenReturn(List.of());
        when(ai.analyzeSubmission(any(), any(), any()))
                .thenThrow(
                        timeout
                                ? new VerificationTimeoutException()
                                : new IllegalStateException("Provider error containing private submission data"));

        new CheckWorker(repository, mock(ArticleExtractor.class), factChecks, ai)
                .processTextCheckAsync(check.getId(), "A factual claim.");

        assertThat(check.getStatus()).isEqualTo(CheckStatus.FAILED);
        assertThat(check.getStage()).isEqualTo(CheckStage.FAILED);
        assertThat(check.getOverallVerdict()).isNull();
        assertThat(check.getResultJson()).isNull();
        assertThat(check.getCompletedAt()).isNotNull();
        assertThat(check.getErrorMessage()).contains("Live Google Search").doesNotContain("private submission");
        if (timeout) {
            assertThat(check.getErrorMessage()).contains("timed out");
        }
        verify(repository, atLeastOnce()).save(check);
    }
}
