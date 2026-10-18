package com.veryfact.check;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.veryfact.check.domain.CheckStage;
import com.veryfact.check.domain.CheckStatus;
import com.veryfact.check.dto.CreateCheckResponse;
import com.veryfact.common.exception.GlobalExceptionHandler;
import com.veryfact.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
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
    void createCheck_whenTooShort_returns400ProblemDetail() throws Exception {
        mockMvc.perform(post("/api/checks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"Too short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid Request"));
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
