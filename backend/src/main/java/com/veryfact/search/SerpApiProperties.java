package com.veryfact.search;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "veryfact.search.serpapi")
public record SerpApiProperties(String apiKey) {}
