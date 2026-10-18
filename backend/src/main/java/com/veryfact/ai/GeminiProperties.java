package com.veryfact.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "veryfact.gemini")
public record GeminiProperties(String apiKey, String model) {}
