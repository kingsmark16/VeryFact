package com.veryfact.check.domain;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface FactCheckRepository extends JpaRepository<FactCheck, UUID> {

    @Modifying
    @Transactional
    @Query("""
            update FactCheck c set c.status = :failedStatus, c.stage = :failedStage,
                c.errorMessage = :message, c.completedAt = :now
            where c.status in :activeStatuses and c.createdAt < :cutoff
            """)
    int expireUnfinishedChecks(
            List<CheckStatus> activeStatuses,
            Instant cutoff,
            Instant now,
            CheckStatus failedStatus,
            CheckStage failedStage,
            String message);

    Optional<FactCheck> findBySlug(String slug);

    Optional<FactCheck> findFirstByContentHashAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
            String contentHash, CheckStatus status, Instant createdAtAfter);

    List<FactCheck> findTop6ByStatusAndOverallVerdictIsNotNullOrderByCreatedAtDesc(CheckStatus status);
}
