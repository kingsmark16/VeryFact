package com.veryfact.check.domain;

public enum CheckStage {
    QUEUED,
    EXTRACTING_CLAIMS,
    VERIFYING_CLAIMS,
    COMPLETED,
    FAILED
}
