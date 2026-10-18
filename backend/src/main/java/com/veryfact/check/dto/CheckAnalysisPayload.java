package com.veryfact.check.dto;

import java.util.List;

public record CheckAnalysisPayload(List<ClaimDto> claims, List<String> redFlags) {}
