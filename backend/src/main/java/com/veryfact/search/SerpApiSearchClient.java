package com.veryfact.search;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

@Component
public class SerpApiSearchClient {
    private final SerpApiProperties properties;
    private final RestClient client;

    @Autowired
    public SerpApiSearchClient(SerpApiProperties properties) {
        this(properties, RestClient.builder().baseUrl("https://serpapi.com").requestFactory(requestFactory()));
    }

    SerpApiSearchClient(SerpApiProperties properties, RestClient.Builder builder) {
        this.properties = properties;
        this.client = builder.build();
    }

    private static JdkClientHttpRequestFactory requestFactory() {
        var factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build());
        factory.setReadTimeout(Duration.ofSeconds(10));
        return factory;
    }

    public void requireConfigured() {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            throw new SearchUnavailableException(
                    "Live Google Search is not configured on this server. Please contact the app owner.");
        }
    }

    public List<SearchResult> search(String query) {
        requireConfigured();
        if (query == null || query.isBlank() || query.length() > 250) {
            throw new IllegalArgumentException("Search query must contain 1 to 250 characters");
        }
        try {
            JsonNode body = client.get()
                    .uri(builder -> builder.path("/search.json")
                            .queryParam("engine", "google")
                            .queryParam("q", query)
                            .queryParam("no_cache", true)
                            .queryParam("api_key", properties.apiKey())
                            .build())
                    .retrieve()
                    .body(JsonNode.class);
            if (body == null
                    || body.hasNonNull("error")
                    || !"Success"
                            .equals(body.path("search_metadata").path("status").asText())) {
                throw new SearchUnavailableException(
                        "Live Google Search is unavailable or its free allowance was reached. Please try again later.");
            }
            return body.path("organic_results")
                    .valueStream()
                    .map(node -> new SearchResult(
                            node.path("title").asText(""),
                            node.path("link").asText(""),
                            node.path("snippet").asText("")))
                    .filter(result -> validUrl(result.url()))
                    .distinct()
                    .limit(3)
                    .toList();
        } catch (SearchUnavailableException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            // Never retain the exception: HTTP errors can include query text and the API key.
            throw new SearchUnavailableException(
                    "Live Google Search is unavailable or its free allowance was reached. Please try again later.");
        }
    }

    private static boolean validUrl(String url) {
        try {
            URI uri = URI.create(url);
            return ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()))
                    && uri.getHost() != null
                    && uri.getUserInfo() == null;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    public record SearchResult(String title, String url, String snippet) {}
}
