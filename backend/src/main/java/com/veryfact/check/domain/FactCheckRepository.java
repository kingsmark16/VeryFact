package com.veryfact.check.domain;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FactCheckRepository extends JpaRepository<FactCheck, UUID> {

    Optional<FactCheck> findBySlug(String slug);

    Optional<FactCheck> findFirstByContentHashAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
            String contentHash, CheckStatus status, Instant createdAtAfter);

    List<FactCheck> findTop6ByStatusAndOverallVerdictIsNotNullOrderByCreatedAtDesc(CheckStatus status);
}
