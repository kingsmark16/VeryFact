package com.veryfact.extractor;

import java.io.IOException;
import java.net.URI;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

@Component
public class ArticleExtractor {

    private static final int TIMEOUT_MS = 10_000;
    private static final int MAX_BODY_BYTES = 2 * 1024 * 1024;
    private static final int MAX_EXTRACTED_CHARS = 18_000;

    private final SsrfGuard ssrfGuard;

    public ArticleExtractor(SsrfGuard ssrfGuard) {
        this.ssrfGuard = ssrfGuard;
    }

    public String extractTextFromUrl(String rawUrl) {
        URI safeUri = ssrfGuard.validatePublicHttpUri(rawUrl);

        try {
            Document doc = Jsoup.connect(safeUri.toString())
                    .userAgent("VeryFactBot/1.0 (+https://github.com/kingsmark16/VeryFact)")
                    .timeout(TIMEOUT_MS)
                    .maxBodySize(MAX_BODY_BYTES)
                    .followRedirects(false)
                    .get();

            String title = doc.title();
            Element mainEl = doc.selectFirst("article, main, [role=main]");
            String body = mainEl != null
                    ? mainEl.text()
                    : doc.body() != null ? doc.body().text() : "";

            String combined = (title != null && !title.isBlank() ? title + "\n\n" + body : body).trim();
            if (combined.length() < 20) {
                throw new IllegalArgumentException("Could not extract enough readable article text from the URL.");
            }

            return combined.length() > MAX_EXTRACTED_CHARS ? combined.substring(0, MAX_EXTRACTED_CHARS) : combined;
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to fetch article from the provided URL.");
        }
    }
}
