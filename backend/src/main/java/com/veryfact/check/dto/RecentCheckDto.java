package com.veryfact.check.dto;

import com.veryfact.check.domain.InputType;
import com.veryfact.check.domain.Verdict;
import java.time.Instant;

public record RecentCheckDto(
        String slug,
        InputType inputType,
        String inputExcerpt,
        Verdict overallVerdict,
        Double confidence,
        String summary,
        Instant createdAt) {}
