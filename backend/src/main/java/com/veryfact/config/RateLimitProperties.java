package com.veryfact.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "veryfact.ratelimit")
public record RateLimitProperties(int requestsPerHour) {}
