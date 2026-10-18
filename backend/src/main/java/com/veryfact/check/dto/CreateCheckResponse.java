package com.veryfact.check.dto;

import com.veryfact.check.domain.CheckStage;
import com.veryfact.check.domain.CheckStatus;

public record CreateCheckResponse(String slug, CheckStatus status, CheckStage stage, boolean cached) {}
