package com.veryfact.check.domain;

public enum CheckStage {
    QUEUED,
    EXTRACTING_CLAIMS,
    SEARCHING_FACT_CHECKS,
    VERIFYING_CLAIMS,
    COMPLETED,
    FAILED
}
