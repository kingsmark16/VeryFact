package com.veryfact.search;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import java.net.SocketTimeoutException;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class SerpApiSearchClientTest {
    @Test
    void usesGoogleEngineAndLiveResultsAndDropsUnsafeUrls() {
        var builder = RestClient.builder().baseUrl("https://serpapi.com");
        var server = MockRestServiceServer.bindTo(builder).build();
        var client = new SerpApiSearchClient(new SerpApiProperties("dummy-key"), builder);
        server.expect(request -> {
                    var uri = request.getURI();
                    assertThat(uri.getHost()).isEqualTo("serpapi.com");
                    assertThat(uri.getPath()).isEqualTo("/search.json");
                    assertThat(uri.getQuery()).contains("engine=google", "no_cache=true");
                })
                .andRespond(withSuccess("""
                {"search_metadata":{"status":"Success"},"organic_results":[
                {"title":"Official source","link":"https://example.com/report","snippet":"Evidence"},
                {"title":"Unsafe","link":"javascript:alert(1)"},
                {"title":"Credential URL","link":"https://secret@example.com/report"}]}
                """, MediaType.APPLICATION_JSON));

        assertThat(client.search("a claim"))
                .containsExactly(new SerpApiSearchClient.SearchResult(
                        "Official source", "https://example.com/report", "Evidence"));
        server.verify();
    }

    @Test
    void missingKeyDoesNotMakeAnHttpRequest() {
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        var client = new SerpApiSearchClient(new SerpApiProperties(""), builder);
        assertThatThrownBy(() -> client.search("claim"))
                .isInstanceOf(SearchUnavailableException.class)
                .hasMessageContaining("not configured");
        server.verify();
    }

    @Test
    void neverLeaksHttpErrorsWithSecretsAndQueryText() {
        var builder = RestClient.builder().baseUrl("https://serpapi.com");
        var server = MockRestServiceServer.bindTo(builder).build();
        var client = new SerpApiSearchClient(new SerpApiProperties("dummy-key"), builder);
        server.expect(requestTo(org.hamcrest.Matchers.anything()))
                .andRespond(withException(new SocketTimeoutException("private article and dummy-key")));
        assertThatThrownBy(() -> client.search("private article"))
                .isInstanceOf(SearchUnavailableException.class)
                .hasMessageNotContaining("private article")
                .hasMessageNotContaining("dummy-key")
                .hasCause(null);
        server.verify();
    }

    @Test
    void quotaFailureDoesNotBecomeEvidence() {
        var builder = RestClient.builder().baseUrl("https://serpapi.com");
        var server = MockRestServiceServer.bindTo(builder).build();
        var client = new SerpApiSearchClient(new SerpApiProperties("dummy-key"), builder);
        server.expect(requestTo(org.hamcrest.Matchers.anything()))
                .andRespond(withSuccess("{\"error\":\"API key limit reached\"}", MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> client.search("claim"))
                .isInstanceOf(SearchUnavailableException.class)
                .hasMessageContaining("allowance");
        server.verify();
    }
}
