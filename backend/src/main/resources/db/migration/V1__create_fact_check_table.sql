CREATE TABLE fact_check (
    id              UUID PRIMARY KEY,
    slug            VARCHAR(16) UNIQUE NOT NULL,
    content_hash    VARCHAR(64) NOT NULL,
    input_type      VARCHAR(16) NOT NULL,
    source_url      TEXT,
    input_excerpt   TEXT NOT NULL,
    language        VARCHAR(8),
    status          VARCHAR(16) NOT NULL,
    stage           VARCHAR(32) NOT NULL,
    overall_verdict VARCHAR(24),
    confidence      DOUBLE PRECISION,
    summary         TEXT,
    result_json     JSONB,
    error_message   TEXT,
    model_version   VARCHAR(64),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_fact_check_hash_status ON fact_check (content_hash, status, created_at DESC);