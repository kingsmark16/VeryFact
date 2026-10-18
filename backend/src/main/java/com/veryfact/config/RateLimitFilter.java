package com.veryfact.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.HexFormat;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = Duration.ofHours(1).toMillis();

    private final RateLimitProperties properties;
    private final ObjectMapper objectMapper;
    private final String bootSalt;
    private final ConcurrentHashMap<String, WindowBucket> buckets = new ConcurrentHashMap<>();

    public RateLimitFilter(RateLimitProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        byte[] saltBytes = new byte[16];
        new SecureRandom().nextBytes(saltBytes);
        this.bootSalt = HexFormat.of().formatHex(saltBytes);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !("POST".equalsIgnoreCase(request.getMethod()) && "/api/checks".equals(request.getRequestURI()));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        int limit = properties.requestsPerHour() > 0 ? properties.requestsPerHour() : 10;
        String ipHash = hashClientIp(request.getRemoteAddr());
        long now = System.currentTimeMillis();

        if (buckets.size() > 10_000) {
            buckets.entrySet().removeIf(e -> now - e.getValue().windowStartMillis >= WINDOW_MILLIS);
        }

        WindowBucket bucket = buckets.compute(ipHash, (k, existing) -> {
            if (existing == null || now - existing.windowStartMillis >= WINDOW_MILLIS) {
                return new WindowBucket(now, new AtomicInteger(1));
            }
            existing.count.incrementAndGet();
            return existing;
        });

        if (bucket.count.get() > limit) {
            long retryAfterSeconds = Math.max(1L, (WINDOW_MILLIS - (now - bucket.windowStartMillis)) / 1000L);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);

            ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Rate limit exceeded (" + limit + " checks per hour). Please try again later.");
            problem.setTitle("Too Many Requests");
            response.getWriter().write(objectMapper.writeValueAsString(problem));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String hashClientIp(String remoteAddr) {
        String raw = (remoteAddr != null ? remoteAddr : "unknown") + ":" + bootSalt;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }

    private record WindowBucket(long windowStartMillis, AtomicInteger count) {}
}
