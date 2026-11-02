package com.veryfact;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.veryfact.check.CheckRecovery;
import com.veryfact.check.domain.*;
import jakarta.persistence.EntityManager;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private FactCheckRepository repository;

    @Autowired
    private CheckRecovery recovery;

    @Autowired
    private EntityManager entityManager;

    @Test
    @Transactional
    void expiresAbandonedChecksButPreservesFreshAndCompletedChecks() {
        FactCheck abandoned = new FactCheck(UUID.randomUUID(), "abandoned1", "old", InputType.TEXT, "test");
        abandoned.setStatus(CheckStatus.PROCESSING);
        abandoned.setStage(CheckStage.VERIFYING_CLAIMS);
        ReflectionTestUtils.setField(abandoned, "createdAt", Instant.now().minus(Duration.ofMinutes(6)));
        FactCheck fresh = new FactCheck(UUID.randomUUID(), "freshCheck", "fresh", InputType.TEXT, "test");
        FactCheck completed = new FactCheck(UUID.randomUUID(), "completed1", "done", InputType.TEXT, "test");
        completed.setStatus(CheckStatus.COMPLETED);
        completed.setStage(CheckStage.COMPLETED);
        ReflectionTestUtils.setField(completed, "createdAt", Instant.now().minus(Duration.ofMinutes(6)));
        repository.saveAllAndFlush(java.util.List.of(abandoned, fresh, completed));

        recovery.expireAbandonedChecks();
        entityManager.clear();

        FactCheck expired = repository.findById(abandoned.getId()).orElseThrow();
        assertThat(expired.getStatus()).isEqualTo(CheckStatus.FAILED);
        assertThat(expired.getStage()).isEqualTo(CheckStage.FAILED);
        assertThat(expired.getCompletedAt()).isNotNull();
        assertThat(repository.findById(fresh.getId()).orElseThrow().getStatus()).isEqualTo(CheckStatus.PENDING);
        assertThat(repository.findById(completed.getId()).orElseThrow().getStatus())
                .isEqualTo(CheckStatus.COMPLETED);
    }

    @Test
    void contextLoadsAndExportsOpenApiContract() throws Exception {
        MockMvc mockMvc =
                MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        String openApiJson = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        Path outputPath = Path.of("../contracts/openapi.json");
        Files.createDirectories(outputPath.getParent());
        Files.writeString(outputPath, openApiJson, StandardCharsets.UTF_8);
    }
}
