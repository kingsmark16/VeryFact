package com.veryfact.extractor;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class SsrfGuardTest {

    private final SsrfGuard ssrfGuard = new SsrfGuard();

    @Test
    void validatePublicHttpUri_whenLocalhost_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> ssrfGuard.validatePublicHttpUri("http://127.0.0.1:8080/admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("private or local networks");
    }

    @Test
    void validatePublicHttpUri_whenNonHttpScheme_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> ssrfGuard.validatePublicHttpUri("file:///etc/passwd"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only http and https URLs are allowed");
    }
}
