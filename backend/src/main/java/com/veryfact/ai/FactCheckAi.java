package com.veryfact.ai;

import com.veryfact.check.domain.Verdict;
import com.veryfact.check.dto.ClaimDto;
import com.veryfact.check.dto.FactCheckMatchDto;
import java.util.List;

public interface FactCheckAi {

    AiVerificationOutput analyzeText(String text, List<FactCheckMatchDto> factChecks);

    record AiVerificationOutput(
            String language,
            Verdict overallVerdict,
            double confidence,
            String summary,
            List<ClaimDto> claims,
            List<String> redFlags,
            String modelVersion) {}
}
