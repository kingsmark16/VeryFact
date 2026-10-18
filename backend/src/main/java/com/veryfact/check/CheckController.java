package com.veryfact.check;

import com.veryfact.check.dto.CheckResultDto;
import com.veryfact.check.dto.CreateCheckRequest;
import com.veryfact.check.dto.CreateCheckResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/checks")
public class CheckController {

    private final CheckService checkService;

    public CheckController(CheckService checkService) {
        this.checkService = checkService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CreateCheckResponse> createCheck(@Valid @RequestBody CreateCheckRequest request) {
        CreateCheckResponse response = checkService.submitTextCheck(request);
        HttpStatus status = response.cached() ? HttpStatus.OK : HttpStatus.ACCEPTED;
        return ResponseEntity.status(status).body(response);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CreateCheckResponse> createMultipartCheck(
            @RequestParam(name = "text", required = false) String text,
            @RequestParam(name = "url", required = false) String url,
            @RequestPart(name = "images", required = false) List<MultipartFile> images) {
        CreateCheckResponse response = checkService.submitMultipartCheck(text, url, images);
        HttpStatus status = response.cached() ? HttpStatus.OK : HttpStatus.ACCEPTED;
        return ResponseEntity.status(status).body(response);
    }

    @GetMapping("/{slug}")
    public CheckResultDto getCheck(@PathVariable String slug) {
        return checkService.getBySlug(slug);
    }
}
