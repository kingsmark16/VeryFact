package com.veryfact.factcheck;

import com.veryfact.check.dto.FactCheckMatchDto;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class FactCheckToolsClient {

    private static final Logger log = LoggerFactory.getLogger(FactCheckToolsClient.class);
    private static final String BASE_URL = "https://factchecktools.googleapis.com";
    private static final int MAX_QUERY_CHARS = 180;

    private final FactCheckProperties properties;
    private final RestClient restClient;

    public FactCheckToolsClient(FactCheckProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder().baseUrl(BASE_URL).build();
    }

    public List<FactCheckMatchDto> searchClaims(String rawText) {
        if (properties.apiKey() == null || properties.apiKey().isBlank() || rawText == null || rawText.isBlank()) {
            return List.of();
        }

        String query = buildConciseQuery(rawText);
        try {
            ClaimsSearchResponse response = restClient
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1alpha1/claims:search")
                            .queryParam("query", query)
                            .queryParam("pageSize", 5)
                            .queryParam("key", properties.apiKey())
                            .build())
                    .retrieve()
                    .body(ClaimsSearchResponse.class);

            if (response == null || response.claims() == null) {
                return List.of();
            }

            List<FactCheckMatchDto> matches = new ArrayList<>();
            for (ClaimItem item : response.claims()) {
                if (item.claimReview() == null) {
                    continue;
                }
                for (ClaimReview review : item.claimReview()) {
                    if (review.url() != null
                            && (review.url().startsWith("https://")
                                    || review.url().startsWith("http://"))) {
                        matches.add(new FactCheckMatchDto(
                                item.text() != null ? item.text() : "",
                                item.claimant() != null ? item.claimant() : "",
                                review.publisher() != null && review.publisher().name() != null
                                        ? review.publisher().name()
                                        : "",
                                review.title() != null ? review.title() : "",
                                review.url(),
                                review.textualRating() != null ? review.textualRating() : ""));
                    }
                }
            }
            return matches;
        } catch (Exception ex) {
            log.warn("Fact Check Tools API lookup skipped or unavailable: {}", ex.getMessage());
            return List.of();
        }
    }

    private String buildConciseQuery(String rawText) {
        String normalized = rawText.replaceAll("\\s+", " ").trim();
        int firstSentenceEnd = normalized.indexOf('.');
        String candidate = firstSentenceEnd > 20 ? normalized.substring(0, firstSentenceEnd) : normalized;
        return candidate.length() > MAX_QUERY_CHARS ? candidate.substring(0, MAX_QUERY_CHARS) : candidate;
    }

    record ClaimsSearchResponse(List<ClaimItem> claims) {}

    record ClaimItem(String text, String claimant, List<ClaimReview> claimReview) {}

    record ClaimReview(Publisher publisher, String url, String title, String textualRating) {}

    record Publisher(String name, String site) {}
}
