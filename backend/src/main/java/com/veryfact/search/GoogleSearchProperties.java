package com.veryfact.search;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "veryfact.search")
public record GoogleSearchProperties(
        @DefaultValue("serpapi") String provider) {
    public GoogleSearchProperties {
        if (!"serpapi".equals(provider) && !"gemini".equals(provider)) {
            throw new IllegalArgumentException("Search provider must be serpapi or gemini");
        }
    }
}
