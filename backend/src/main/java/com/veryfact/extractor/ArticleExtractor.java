package com.veryfact.extractor;

import java.io.IOException;
import java.net.URI;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

@Component
public class ArticleExtractor {

    private static final int TIMEOUT_MS = 10_000;
    private static final int MAX_BODY_BYTES = 2 * 1024 * 1024;
    private static final int MAX_EXTRACTED_CHARS = 18_000;
    private static final int MAX_REDIRECTS = 3;
    private static final String BROWSER_USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

    private final SsrfGuard ssrfGuard;

    public ArticleExtractor(SsrfGuard ssrfGuard) {
        this.ssrfGuard = ssrfGuard;
    }

    public String extractTextFromUrl(String rawUrl) {
        URI currentUri = ssrfGuard.validatePublicHttpUri(rawUrl);

        try {
            Document doc = fetchWithSafeRedirects(currentUri);

            String title = doc.title();
            String metaDesc = doc.select("meta[property=og:description], meta[name=description]")
                    .attr("content");
            Element mainEl = doc.selectFirst("article, main, [role=main]");
            String body = mainEl != null
                    ? mainEl.text()
                    : doc.body() != null ? doc.body().text() : "";

            StringBuilder combinedBuilder = new StringBuilder();
            if (title != null && !title.isBlank()) {
                combinedBuilder.append(title.trim()).append("\n\n");
            }
            if (metaDesc != null && !metaDesc.isBlank()) {
                combinedBuilder.append(metaDesc.trim()).append("\n\n");
            }
            if (body != null && !body.isBlank()) {
                combinedBuilder.append(body.trim());
            }

            String combined = combinedBuilder.toString().trim();
            if (combined.length() < 20) {
                throw new IllegalArgumentException("Could not extract enough readable article text from the URL.");
            }

            return combined.length() > MAX_EXTRACTED_CHARS ? combined.substring(0, MAX_EXTRACTED_CHARS) : combined;
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to fetch article from the provided URL.");
        }
    }

    private Document fetchWithSafeRedirects(URI initialUri) throws IOException {
        URI uri = initialUri;
        for (int hop = 0; hop <= MAX_REDIRECTS; hop++) {
            Connection.Response response = Jsoup.connect(uri.toString())
                    .userAgent(BROWSER_USER_AGENT)
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .timeout(TIMEOUT_MS)
                    .maxBodySize(MAX_BODY_BYTES)
                    .followRedirects(false)
                    .execute();

            int status = response.statusCode();
            if (status >= 300 && status < 400) {
                String location = response.header("Location");
                if (location == null || location.isBlank()) {
                    throw new IOException("Redirect without Location header");
                }
                URI redirected = uri.resolve(location);
                uri = ssrfGuard.validatePublicHttpUri(redirected.toString());
                continue;
            }
            return response.parse();
        }
        throw new IOException("Too many redirects");
    }
}
