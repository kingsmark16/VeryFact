package com.veryfact.ai;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.google.genai.types.*;
import com.veryfact.common.util.ImageValidator.ValidatedImage;
import com.veryfact.extractor.ArticleExtractor;
import com.veryfact.search.SearchUnavailableException;
import com.veryfact.search.SerpApiSearchClient;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class GoogleSearchFactCheckAiTest {
    private static final String URL = "https://example.com/official-report";
    private static final String REPORT = """
            {"language":"en","overallVerdict":"TRUE","confidence":0.8,"summary":"Supported.",
            "claims":[{"claim":"A factual claim.","verdict":"TRUE","confidence":0.8,"explanation":"Official source confirms it.",
            "sources":[{"title":"Model title","url":"https://example.com/official-report","publisher":"Model publisher"}]}],"redFlags":[]}
            """;

    @Test
    void searchesGoogleBetweenTwoToolFreeGeminiRequestsAndKeepsImageEvidence() {
        var search = mock(SerpApiSearchClient.class);
        var extractor = mock(ArticleExtractor.class);
        when(search.search("a central claim"))
                .thenReturn(List.of(new SerpApiSearchClient.SearchResult("Official report", URL, "Search snippet")));
        when(extractor.extractTextFromUrl(URL)).thenReturn("Retrieved page evidence.");
        var count = new AtomicInteger();
        var properties = new GeminiProperties("test-key", "gemini-3.5-flash-lite");
        var mapper = new ObjectMapper();
        var gemini = new GeminiFactCheckAi(
                properties,
                mapper,
                request -> {
                    throw new AssertionError("Must not call paid built-in Search");
                },
                request -> {
                    assertThat(request.config().tools().orElse(List.of())).isEmpty();
                    assertThat(request.config().responseMimeType()).contains("application/json");
                    assertThat(request.content().parts().orElseThrow()).hasSize(2);
                    if (count.incrementAndGet() == 1) {
                        return response("{\"queries\":[\"a central claim\",\"a central claim\"]}");
                    }
                    assertThat(request.content()
                                    .parts()
                                    .orElseThrow()
                                    .getFirst()
                                    .text()
                                    .orElseThrow())
                            .contains(URL, "Retrieved page evidence.", "google_search_evidence");
                    return response(REPORT);
                });

        var output = new GoogleSearchFactCheckAi(properties, gemini, search, extractor, mapper)
                .analyzeSubmission(
                        "A factual claim.", List.of(new ValidatedImage(new byte[] {1, 2}, "image/png")), List.of());

        assertThat(count.get()).isEqualTo(2);
        assertThat(output.modelVersion()).isEqualTo("gemini-3.5-flash-lite-serpapi-search-v1");
        assertThat(output.claims().getFirst().sources().getFirst().title()).isEqualTo("Official report");
        assertThat(output.claims().getFirst().sources().getFirst().publisher()).isEqualTo("example.com");
        verify(search, times(1)).search("a central claim");
    }

    @Test
    void missingSearchKeyFailsBeforeModelCalls() {
        var search = mock(SerpApiSearchClient.class);
        var gemini = mock(GeminiFactCheckAi.class);
        doThrow(new SearchUnavailableException("Not configured")).when(search).requireConfigured();
        var ai = new GoogleSearchFactCheckAi(
                new GeminiProperties("key", "gemini-3.5-flash-lite"),
                gemini,
                search,
                mock(ArticleExtractor.class),
                new ObjectMapper());
        assertThatThrownBy(() -> ai.analyzeText("A claim.", List.of())).isInstanceOf(SearchUnavailableException.class);
        verifyNoInteractions(gemini);
    }

    @Test
    void emptyGoogleResultsNeverProduceAnUngroundedVerdict() {
        var search = mock(SerpApiSearchClient.class);
        when(search.search(anyString())).thenReturn(List.of());
        var calls = new AtomicInteger();
        var mapper = new ObjectMapper();
        var properties = new GeminiProperties("key", "gemini-3.5-flash-lite");
        var gemini = new GeminiFactCheckAi(
                properties,
                mapper,
                request -> {
                    throw new AssertionError();
                },
                request -> {
                    calls.incrementAndGet();
                    return response("{\"queries\":[\"a claim\"]}");
                });
        var ai = new GoogleSearchFactCheckAi(properties, gemini, search, mock(ArticleExtractor.class), mapper);
        assertThatThrownBy(() -> ai.analyzeText("A claim.", List.of())).isInstanceOf(SearchUnavailableException.class);
        assertThat(calls.get()).isEqualTo(1);
    }

    @Test
    void rejectsInventedCitationUrlsEvenWhenGoogleFoundOtherEvidence() {
        var search = mock(SerpApiSearchClient.class);
        when(search.search(anyString()))
                .thenReturn(List.of(new SerpApiSearchClient.SearchResult("Real", URL, "Snippet")));
        var extractor = mock(ArticleExtractor.class);
        when(extractor.extractTextFromUrl(URL)).thenThrow(new IllegalArgumentException("Blocked or unavailable"));
        var mapper = new ObjectMapper();
        var properties = new GeminiProperties("key", "gemini-3.5-flash-lite");
        var calls = new AtomicInteger();
        var gemini = new GeminiFactCheckAi(
                properties,
                mapper,
                request -> {
                    throw new AssertionError();
                },
                request -> response(
                        calls.incrementAndGet() == 1
                                ? "{\"queries\":[\"a claim\"]}"
                                : REPORT.replace(URL, "https://invented.example/report")));
        var ai = new GoogleSearchFactCheckAi(properties, gemini, search, extractor, mapper);
        assertThatThrownBy(() -> ai.analyzeText("A claim.", List.of()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("absent from Google results");
    }

    private static GenerateContentResponse response(String text) {
        return GenerateContentResponse.builder()
                .candidates(Candidate.builder()
                        .finishReason(FinishReason.Known.STOP)
                        .content(Content.fromParts(Part.fromText(text)))
                        .build())
                .build();
    }
}
