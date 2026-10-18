package com.veryfact.check;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.veryfact.check.domain.CheckStage;
import com.veryfact.check.domain.CheckStatus;
import com.veryfact.check.domain.FactCheck;
import com.veryfact.check.domain.FactCheckRepository;
import com.veryfact.check.domain.InputType;
import com.veryfact.check.dto.CreateCheckRequest;
import com.veryfact.check.dto.CreateCheckResponse;
import com.veryfact.common.exception.ResourceNotFoundException;
import com.veryfact.common.util.ContentHasher;
import com.veryfact.common.util.SlugGenerator;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CheckServiceTest {

    @Mock
    private FactCheckRepository repository;

    @Mock
    private CheckWorker checkWorker;

    private CheckService checkService;

    @BeforeEach
    void setUp() {
        checkService = new CheckService(repository, new ContentHasher(), new SlugGenerator(), checkWorker);
    }

    @Test
    void submitTextCheck_whenCacheMiss_savesPendingAndTriggersWorker() {
        when(repository.findFirstByContentHashAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
                        any(), eq(CheckStatus.COMPLETED), any()))
                .thenReturn(Optional.empty());

        CreateCheckResponse response = checkService.submitTextCheck(
                new CreateCheckRequest("Scientists confirm drinking 5 liters of coffee daily makes you immortal."));

        assertThat(response.cached()).isFalse();
        assertThat(response.status()).isEqualTo(CheckStatus.PENDING);
        assertThat(response.stage()).isEqualTo(CheckStage.QUEUED);
        assertThat(response.slug()).hasSize(10);
        verify(repository).save(any(FactCheck.class));
        verify(checkWorker).processTextCheckAsync(any(UUID.class), any(String.class));
    }

    @Test
    void submitTextCheck_whenCacheHit_returnsCachedWithoutTriggeringWorker() {
        FactCheck existing = new FactCheck(UUID.randomUUID(), "abc123XYZ0", "hash", InputType.TEXT, "excerpt");
        existing.setStatus(CheckStatus.COMPLETED);
        existing.setStage(CheckStage.COMPLETED);

        when(repository.findFirstByContentHashAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
                        any(), eq(CheckStatus.COMPLETED), any()))
                .thenReturn(Optional.of(existing));

        CreateCheckResponse response = checkService.submitTextCheck(
                new CreateCheckRequest("Scientists confirm drinking 5 liters of coffee daily makes you immortal."));

        assertThat(response.cached()).isTrue();
        assertThat(response.slug()).isEqualTo("abc123XYZ0");
        verify(checkWorker, never()).processTextCheckAsync(any(), any());
    }

    @Test
    void getBySlug_whenMissing_throwsResourceNotFoundException() {
        when(repository.findBySlug("missing123")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> checkService.getBySlug("missing123"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("missing123");
    }
}
