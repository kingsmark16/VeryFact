package com.veryfact.check;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.veryfact.check.domain.CheckStage;
import com.veryfact.check.domain.CheckStatus;
import com.veryfact.check.domain.InputType;
import com.veryfact.check.domain.Verdict;
import com.veryfact.check.dto.CreateCheckResponse;
import com.veryfact.check.dto.RecentCheckDto;
import com.veryfact.common.exception.GlobalExceptionHandler;
import com.veryfact.common.exception.ResourceNotFoundException;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CheckController.class)
@Import(GlobalExceptionHandler.class)
class CheckControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CheckService checkService;

    @Test
    void createCheck_whenValidNewSubmission_returns202Accepted() throws Exception {
        when(checkService.submitTextCheck(any()))
                .thenReturn(new CreateCheckResponse("slug123456", CheckStatus.PENDING, CheckStage.QUEUED, false));

        mockMvc.perform(post("/api/checks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"Breaking news article claiming the moon is made of green cheese.\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.slug").value("slug123456"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.cached").value(false));
    }

    @Test
    void createMultipartCheck_whenUrlOrImagesProvided_returns202Accepted() throws Exception {
        when(checkService.submitMultipartCheck(any(), any(), any()))
                .thenReturn(new CreateCheckResponse("slugMulti1", CheckStatus.PENDING, CheckStage.QUEUED, false));

        MockMultipartFile image =
                new MockMultipartFile("images", "screenshot.png", "image/png", new byte[] {1, 2, 3, 4});

        mockMvc.perform(multipart("/api/checks")
                        .file(image)
                        .param("url", "https://example.com/news")
                        .param("text", "Context note"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.slug").value("slugMulti1"));
    }

    @Test
    void createCheck_whenTooShort_returns400ProblemDetail() throws Exception {
        mockMvc.perform(post("/api/checks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"Too short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid Request"));
    }

    @Test
    void getRecentChecks_returnsListOfRecentChecks() throws Exception {
        RecentCheckDto dto = new RecentCheckDto(
                "recent12345",
                InputType.TEXT,
                "Excerpt sample",
                Verdict.MOSTLY_TRUE,
                0.88,
                "Summary sample",
                Instant.parse("2026-10-24T12:00:00Z"));

        when(checkService.getRecentChecks()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/checks/recent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value("recent12345"))
                .andExpect(jsonPath("$[0].inputType").value("TEXT"))
                .andExpect(jsonPath("$[0].overallVerdict").value("MOSTLY_TRUE"))
                .andExpect(jsonPath("$[0].confidence").value(0.88));
    }

    @Test
    void getCheck_whenNotFound_returns404ProblemDetail() throws Exception {
        when(checkService.getBySlug("unknown"))
                .thenThrow(new ResourceNotFoundException("Check result not found: unknown"));

        mockMvc.perform(get("/api/checks/unknown"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource Not Found"));
    }
}
