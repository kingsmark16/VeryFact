package com.veryfact.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import com.google.genai.gaos.models.interactions.CreateModelInteraction;
import com.google.genai.gaos.models.interactions.Interaction;
import com.google.genai.types.*;
import com.veryfact.common.util.ImageValidator.ValidatedImage;
import java.util.List;
import java.util.function.Function;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import tools.jackson.databind.ObjectMapper;

class Gemini25FactCheckAiTest {
    private static final String JSON = """
            {"language":"en","overallVerdict":"TRUE","confidence":0.9,"summary":"Supported by evidence.",
             "claims":[{"claim":"Paris is the capital of France.","verdict":"TRUE","confidence":0.9,
             "explanation":"Confirmed by the cited source.","sources":[{"title":"France","url":"https://example.com/france","publisher":"Example"}]}],
             "redFlags":[]}
            """;

    @Test
    void unavailableModelGetsASpecificFailure() {
        GeminiFactCheckAi ai = new GeminiFactCheckAi(
                new GeminiProperties("test-key", "gemini-2.5-flash-lite"),
                new ObjectMapper(),
                request -> {
                    throw new AssertionError("Must not use Interactions");
                },
                request -> {
                    throw new com.google.genai.errors.ClientException(404, "NOT_FOUND", "Not available to new users");
                });
        assertThatThrownBy(() -> ai.analyzeText("A factual claim.", List.of()))
                .isInstanceOf(VerificationModelUnavailableException.class);
    }

    @Test
    @SuppressWarnings("unchecked")
    void usesBudgetInsteadOfThinkingLevelAndKeepsSearchAndImagesWithoutJsonMode() {
        Function<CreateModelInteraction, Interaction> interactions = mock(Function.class);
        GeminiFactCheckAi ai = new GeminiFactCheckAi(
                new GeminiProperties("test-key", "gemini-2.5-flash-lite"),
                new ObjectMapper(),
                interactions,
                request -> {
                    assertThat(request.model()).isEqualTo("gemini-2.5-flash-lite");
                    assertThat(request.config().thinkingConfig().orElseThrow().thinkingBudget())
                            .contains(0);
                    assertThat(request.config().thinkingConfig().orElseThrow().thinkingLevel())
                            .isEmpty();
                    assertThat(request.config().tools().orElseThrow())
                            .anyMatch(tool -> tool.googleSearch().isPresent());
                    assertThat(request.config().responseMimeType()).isEmpty();
                    assertThat(request.config().responseJsonSchema()).isEmpty();
                    assertThat(request.content().parts().orElseThrow()).hasSize(2);
                    assertThat(request.content()
                                    .parts()
                                    .orElseThrow()
                                    .getFirst()
                                    .text()
                                    .orElseThrow())
                            .contains("<article>", "JSON object", "overallVerdict");
                    assertThat(request.content().parts().orElseThrow().getLast().inlineData())
                            .isPresent();
                    return response("```json\n" + JSON + "\n```", true, new FinishReason(FinishReason.Known.STOP));
                });

        var result = ai.analyzeSubmission(
                "Paris is the capital of France.",
                List.of(new ValidatedImage(new byte[] {1, 2}, "image/png")),
                List.of());

        assertThat(result.modelVersion()).isEqualTo("gemini-2.5-flash-lite-search-v1");
        assertThat(result.claims()).hasSize(1);
        assertThat(result.claims().getFirst().sources()).hasSize(1);
        verifyNoInteractions(interactions);
    }

    @Test
    void failsWithoutGroundingInsteadOfAcceptingAnUngroundedVerdict() {
        GeminiFactCheckAi ai = ai(response(JSON, false, new FinishReason(FinishReason.Known.STOP)));
        assertThatThrownBy(() -> ai.analyzeText("A factual claim.", List.of()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("no grounding evidence");
    }

    @Test
    void rejectsTruncatedReports() {
        GeminiFactCheckAi ai = ai(response(JSON, true, new FinishReason(FinishReason.Known.MAX_TOKENS)));
        assertThatThrownBy(() -> ai.analyzeText("A factual claim.", List.of()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("did not complete");
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "{}",
                "null",
                "{\"language\":\"en\",\"overallVerdict\":\"TRUE\",\"confidence\":1,\"summary\":\"Unsupported\",\"claims\":[]}"
            })
    void rejectsInvalidReportObjects(String json) {
        assertThatThrownBy(() -> ai(response(json, true, new FinishReason(FinishReason.Known.STOP)))
                        .analyzeText("A claim.", List.of()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("invalid report");
    }

    private GeminiFactCheckAi ai(GenerateContentResponse response) {
        return new GeminiFactCheckAi(
                new GeminiProperties("test-key", "gemini-2.5-flash-lite"),
                new ObjectMapper(),
                request -> {
                    throw new AssertionError("Must not use Interactions for 2.5");
                },
                request -> response);
    }

    private static GenerateContentResponse response(String text, boolean grounded, FinishReason reason) {
        Candidate.Builder candidate =
                Candidate.builder().finishReason(reason).content(Content.fromParts(Part.fromText(text)));
        if (grounded) {
            candidate.groundingMetadata(GroundingMetadata.builder()
                    .webSearchQueries("capital of France")
                    .groundingChunks(GroundingChunk.builder()
                            .web(GroundingChunkWeb.builder()
                                    .uri("https://example.com/france")
                                    .title("France")
                                    .build())
                            .build())
                    .build());
        }
        return GenerateContentResponse.builder().candidates(candidate.build()).build();
    }
}
