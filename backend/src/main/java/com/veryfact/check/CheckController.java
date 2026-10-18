package com.veryfact.check;

import com.veryfact.check.dto.CheckResultDto;
import com.veryfact.check.dto.CreateCheckRequest;
import com.veryfact.check.dto.CreateCheckResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checks")
public class CheckController {

    private final CheckService checkService;

    public CheckController(CheckService checkService) {
        this.checkService = checkService;
    }

    @PostMapping
    public ResponseEntity<CreateCheckResponse> createCheck(@Valid @RequestBody CreateCheckRequest request) {
        CreateCheckResponse response = checkService.submitTextCheck(request);
        HttpStatus status = response.cached() ? HttpStatus.OK : HttpStatus.ACCEPTED;
        return ResponseEntity.status(status).body(response);
    }

    @GetMapping("/{slug}")
    public CheckResultDto getCheck(@PathVariable String slug) {
        return checkService.getBySlug(slug);
    }
}
