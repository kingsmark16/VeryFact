package com.veryfact.ai;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.ConstructorBinding;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "veryfact.gemini")
public record GeminiProperties(
        String apiKey, String model, @DefaultValue("60s") Duration requestTimeout) {
    public GeminiProperties(String apiKey, String model) {
        this(apiKey, model, Duration.ofSeconds(60));
    }

    @ConstructorBinding
    public GeminiProperties {
        if (requestTimeout == null
                || requestTimeout.toMillis() < 1
                || requestTimeout.compareTo(Duration.ofSeconds(120)) > 0) {
            throw new IllegalArgumentException("Gemini request timeout must be between 1ms and 120s");
        }
    }
}
