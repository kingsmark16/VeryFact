package com.veryfact.check;

import com.veryfact.check.domain.CheckStage;
import com.veryfact.check.domain.CheckStatus;
import com.veryfact.check.domain.FactCheckRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class CheckRecovery {
    private final FactCheckRepository repository;

    public CheckRecovery(FactCheckRepository repository) {
        this.repository = repository;
    }

    @Scheduled(fixedDelay = 30_000)
    public void expireAbandonedChecks() {
        Instant now = Instant.now();
        repository.expireUnfinishedChecks(
                List.of(CheckStatus.PENDING, CheckStatus.PROCESSING),
                now.minus(Duration.ofMinutes(5)),
                now,
                CheckStatus.FAILED,
                CheckStage.FAILED,
                "Verification expired or was interrupted by a service restart. Please submit a new check.");
    }
}
