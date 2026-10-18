package com.veryfact.check.dto;

import com.veryfact.check.domain.CheckStage;
import com.veryfact.check.domain.CheckStatus;
import com.veryfact.check.domain.InputType;
import com.veryfact.check.domain.Verdict;
import java.time.Instant;
import java.util.List;

public record CheckResultDto(
        String slug,
        InputType inputType,
        String sourceUrl,
        String inputExcerpt,
        String language,
        CheckStatus status,
        CheckStage stage,
        Verdict overallVerdict,
        Double confidence,
        String summary,
        List<ClaimDto> claims,
        List<String> redFlags,
        String errorMessage,
        String modelVersion,
        Instant createdAt,
        Instant completedAt) {}
