package com.veryfact.check.domain;

import com.veryfact.check.dto.CheckAnalysisPayload;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "fact_check")
public class FactCheck {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 16)
    private String slug;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "input_type", nullable = false, length = 16)
    private InputType inputType;

    @Column(name = "source_url")
    private String sourceUrl;

    @Column(name = "input_excerpt", nullable = false)
    private String inputExcerpt;

    @Column(length = 8)
    private String language;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CheckStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private CheckStage stage;

    @Enumerated(EnumType.STRING)
    @Column(name = "overall_verdict", length = 24)
    private Verdict overallVerdict;

    private Double confidence;

    private String summary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result_json", columnDefinition = "jsonb")
    private CheckAnalysisPayload resultJson;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "model_version", length = 64)
    private String modelVersion;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    protected FactCheck() {}

    public FactCheck(UUID id, String slug, String contentHash, InputType inputType, String inputExcerpt) {
        this.id = id;
        this.slug = slug;
        this.contentHash = contentHash;
        this.inputType = inputType;
        this.inputExcerpt = inputExcerpt;
        this.status = CheckStatus.PENDING;
        this.stage = CheckStage.QUEUED;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getSlug() {
        return slug;
    }

    public String getContentHash() {
        return contentHash;
    }

    public InputType getInputType() {
        return inputType;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public String getInputExcerpt() {
        return inputExcerpt;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public CheckStatus getStatus() {
        return status;
    }

    public void setStatus(CheckStatus status) {
        this.status = status;
    }

    public CheckStage getStage() {
        return stage;
    }

    public void setStage(CheckStage stage) {
        this.stage = stage;
    }

    public Verdict getOverallVerdict() {
        return overallVerdict;
    }

    public void setOverallVerdict(Verdict overallVerdict) {
        this.overallVerdict = overallVerdict;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public CheckAnalysisPayload getResultJson() {
        return resultJson;
    }

    public void setResultJson(CheckAnalysisPayload resultJson) {
        this.resultJson = resultJson;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
