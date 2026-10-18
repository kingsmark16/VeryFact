package com.veryfact.factcheck;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "veryfact.factcheck")
public record FactCheckProperties(String apiKey) {}
