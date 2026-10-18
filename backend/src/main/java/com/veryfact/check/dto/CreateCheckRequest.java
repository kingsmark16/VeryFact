package com.veryfact.check.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCheckRequest(
        @NotBlank(message = "Article text is required")
        @Size(min = 20, max = 20000, message = "Article text must be between 20 and 20,000 characters")
        String text) {}
