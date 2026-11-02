package com.veryfact.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.google.genai.gaos.models.interactions.*;
import com.veryfact.check.domain.Verdict;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import tools.jackson.databind.ObjectMapper;

class GeminiFactCheckAiTest {
    private Function<CreateModelInteraction, Interaction> transport;
    private GeminiFactCheckAi ai;
    private static final String JSON = """
            {"language":"en","overallVerdict":"UNVERIFIABLE","confidence":0.2,
             "summary":"Insufficient evidence.","claims":[{"claim":"A factual claim.",
             "verdict":"UNVERIFIABLE","confidence":0.2,"explanation":"Insufficient evidence.","sources":[]}],"redFlags":[]}
            """;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        transport = mock(Function.class);
        ai = new GeminiFactCheckAi(new GeminiProperties("test-key", "gemini-3.8-flash"), new ObjectMapper(), transport);
    }

    @Test
    void stalledRequestTimesOutAndInterruptsTheRequestThread() throws Exception {
        CountDownLatch interrupted = new CountDownLatch(1);
        ai = new GeminiFactCheckAi(
                new GeminiProperties("test-key", "gemini-3.8-flash", Duration.ofMillis(200)),
                new ObjectMapper(),
                request -> {
                    try {
                        new CountDownLatch(1).await();
                        throw new AssertionError("Blocking request must be interrupted");
                    } catch (InterruptedException ex) {
                        interrupted.countDown();
                        throw new IllegalStateException("Cancelled", ex);
                    }
                });

        assertThatThrownBy(() -> ai.analyzeText("A factual claim.", List.of()))
                .isInstanceOf(VerificationTimeoutException.class);
        assertThat(interrupted.await(2, TimeUnit.SECONDS)).isTrue();
    }

    @Test
    void requestsSearchWithLowThinkingAndMarksConfirmedSearch() {
        when(transport.apply(any()))
                .thenReturn(Interaction.builder()
                        .status(InteractionStatus.COMPLETED)
                        .outputText(JSON)
                        .steps(List.of(GoogleSearchResultStep.builder()
                                .callId("search-1")
                                .result(List.of(new GoogleSearchResult()))
                                .build()))
                        .build());

        var output = ai.analyzeText("A factual claim.", List.of());

        assertThat(output.overallVerdict()).isEqualTo(Verdict.UNVERIFIABLE);
        assertThat(output.modelVersion()).isEqualTo("gemini-3.8-flash-search-v1");
        var request = ArgumentCaptor.forClass(CreateModelInteraction.class);
        verify(transport).apply(request.capture());
        assertThat(request.getValue().tools().orElseThrow()).anyMatch(tool -> tool instanceof GoogleSearch);
        assertThat(request.getValue().generationConfig().orElseThrow().thinkingLevel())
                .contains(ThinkingLevel.LOW);
        assertThat(request.getValue().store()).contains(false);
    }

    @Test
    void rejectsModelAnswerWithoutSearchEvidence() {
        when(transport.apply(any()))
                .thenReturn(Interaction.builder()
                        .status(InteractionStatus.COMPLETED)
                        .outputText(JSON)
                        .build());
        assertThatThrownBy(() -> ai.analyzeText("A claim.", List.of()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("no grounding evidence");
        verify(transport, times(1)).apply(any());
    }

    @Test
    void rejectsFailedSearch() {
        when(transport.apply(any()))
                .thenReturn(Interaction.builder()
                        .status(InteractionStatus.COMPLETED)
                        .outputText(JSON)
                        .steps(List.of(GoogleSearchResultStep.builder()
                                .callId("search-1")
                                .isError(true)
                                .result(List.of(new GoogleSearchResult()))
                                .build()))
                        .build());
        assertThatThrownBy(() -> ai.analyzeText("A claim.", List.of()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("no grounding evidence");
    }

    @ParameterizedTest
    @ValueSource(strings = {"401 unauthorized", "429 quota", "503 overloaded", "404 not found"})
    void apiErrorsNeverTriggerUngroundedOrDemoFallback(String error) {
        when(transport.apply(any())).thenThrow(new IllegalStateException(error));
        assertThatThrownBy(() -> ai.analyzeText("A claim.", List.of())).hasMessage(error);
        verify(transport, times(1)).apply(any());
    }

    @Test
    void missingKeyNeverProducesDemoVerdicts() {
        ai = new GeminiFactCheckAi(new GeminiProperties("", "gemini-3.8-flash"), new ObjectMapper(), transport);
        assertThatThrownBy(() -> ai.analyzeText("A claim.", List.of()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not configured");
        verifyNoInteractions(transport);
    }
}
