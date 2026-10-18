package com.veryfact.check.dto;

import com.veryfact.check.domain.Verdict;
import java.util.List;

public record ClaimDto(
        String claim,
        Verdict verdict,
        double confidence,
        String explanation,
        List<SourceDto> sources,
        List<FactCheckMatchDto> factChecks) {}
