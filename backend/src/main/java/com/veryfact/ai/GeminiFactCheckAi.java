package com.veryfact.ai;

import com.google.genai.Client;
import com.google.genai.gaos.models.interactions.Content;
import com.google.genai.gaos.models.interactions.CreateModelInteraction;
import com.google.genai.gaos.models.interactions.CreateModelInteractionResponseFormat;
import com.google.genai.gaos.models.interactions.GenerationConfig;
import com.google.genai.gaos.models.interactions.GoogleSearch;
import com.google.genai.gaos.models.interactions.GoogleSearchResultStep;
import com.google.genai.gaos.models.interactions.ImageContent;
import com.google.genai.gaos.models.interactions.ImageContentMimeType;
import com.google.genai.gaos.models.interactions.Interaction;
import com.google.genai.gaos.models.interactions.InteractionStatus;
import com.google.genai.gaos.models.interactions.InteractionsInput;
import com.google.genai.gaos.models.interactions.Model;
import com.google.genai.gaos.models.interactions.ModelOutputStep;
import com.google.genai.gaos.models.interactions.ResponseFormat;
import com.google.genai.gaos.models.interactions.Step;
import com.google.genai.gaos.models.interactions.TextContent;
import com.google.genai.gaos.models.interactions.TextResponseFormat;
import com.google.genai.gaos.models.interactions.TextResponseFormatMimeType;
import com.google.genai.gaos.models.interactions.ThinkingLevel;
import com.google.genai.gaos.models.operations.CreateInteractionRequestBody;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.HttpRetryOptions;
import com.veryfact.check.domain.Verdict;
import com.veryfact.check.dto.ClaimDto;
import com.veryfact.check.dto.FactCheckMatchDto;
import com.veryfact.check.dto.SourceDto;
import com.veryfact.common.util.ImageValidator.ValidatedImage;
import jakarta.annotation.PreDestroy;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.FutureTask;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class GeminiFactCheckAi implements FactCheckAi {

    private static final Logger log = LoggerFactory.getLogger(GeminiFactCheckAi.class);

    private final GeminiProperties properties;
    private final ObjectMapper objectMapper;
    private final Client client;
    private final Function<CreateModelInteraction, Interaction> createInteraction;
    private final Function<GroundedContentRequest, com.google.genai.types.GenerateContentResponse> generateContent;

    public static final String GROUNDED_VERSION_SUFFIX = "-search-v1";

    @Autowired
    public GeminiFactCheckAi(GeminiProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.client = properties.apiKey() == null || properties.apiKey().isBlank()
                ? null
                : Client.builder()
                        .apiKey(properties.apiKey())
                        .httpOptions(HttpOptions.builder()
                                .timeout(Math.toIntExact(
                                        properties.requestTimeout().toMillis()))
                                .retryOptions(
                                        HttpRetryOptions.builder().attempts(1).build())
                                .build())
                        .build();
        this.createInteraction = params -> client.interactions
                .create(CreateInteractionRequestBody.of(params))
                .interaction()
                .orElseThrow(() -> new IllegalStateException("No interaction returned from Gemini API"));
        this.generateContent =
                request -> client.models.generateContent(request.model(), request.content(), request.config());
    }

    GeminiFactCheckAi(
            GeminiProperties properties,
            ObjectMapper objectMapper,
            Function<CreateModelInteraction, Interaction> createInteraction) {
        this(properties, objectMapper, createInteraction, request -> {
            throw new IllegalStateException("Content generation transport not configured");
        });
    }

    GeminiFactCheckAi(
            GeminiProperties properties,
            ObjectMapper objectMapper,
            Function<CreateModelInteraction, Interaction> createInteraction,
            Function<GroundedContentRequest, com.google.genai.types.GenerateContentResponse> generateContent) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.client = null;
        this.createInteraction = createInteraction;
        this.generateContent = generateContent;
    }

    @PreDestroy
    public void close() {
        if (client != null) {
            client.close();
        }
    }

    @Override
    public AiVerificationOutput analyzeSubmission(
            String text, List<ValidatedImage> images, List<FactCheckMatchDto> factChecks) {
        List<ValidatedImage> safeImages = images != null ? images : List.of();
        List<FactCheckMatchDto> safeFactChecks = factChecks != null ? factChecks : List.of();
        String safeText = text != null ? text : "";
        String modelName = properties.model() == null || properties.model().isBlank()
                ? "gemini-2.5-flash-lite"
                : properties.model();

        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            throw new IllegalStateException("Live verification is unavailable because Gemini is not configured.");
        }

        if (modelName.startsWith("gemini-2.5-")) {
            return analyzeGemini25(safeText, safeImages, safeFactChecks, modelName);
        }

        CreateModelInteractionResponseFormat responseFormat =
                CreateModelInteractionResponseFormat.of(ResponseFormat.of(TextResponseFormat.builder()
                        .mimeType(TextResponseFormatMimeType.APPLICATION_JSON)
                        .schema(PromptTemplates.verificationSchema())
                        .build()));

        String promptText = buildPromptInput(safeText, safeImages.size(), safeFactChecks);
        InteractionsInput input;
        if (safeImages.isEmpty()) {
            input = InteractionsInput.of(promptText);
        } else {
            List<Content> contents = new ArrayList<>();
            contents.add(new TextContent(promptText));
            for (ValidatedImage img : safeImages) {
                contents.add(ImageContent.builder()
                        .data(Base64.getEncoder().encodeToString(img.bytes()))
                        .mimeType(ImageContentMimeType.of(img.mimeType()))
                        .build());
            }
            input = InteractionsInput.ofContent(contents);
        }

        CreateModelInteraction params = CreateModelInteraction.builder()
                .model(Model.of(modelName))
                .systemInstruction(PromptTemplates.SYSTEM_INSTRUCTION)
                .input(input)
                .tools(List.of(new GoogleSearch()))
                .generationConfig(GenerationConfig.builder()
                        .thinkingLevel(ThinkingLevel.LOW)
                        .build())
                .responseFormat(responseFormat)
                .store(false)
                .build();
        Interaction interaction = requestWithDeadline(() -> createInteraction.apply(params));
        if (interaction.status().filter(InteractionStatus.COMPLETED::equals).isEmpty()) {
            throw new IllegalStateException("Google Search verification did not complete. Please try again.");
        }
        boolean searched = interaction.steps().orElse(List.of()).stream()
                .anyMatch(step -> step instanceof GoogleSearchResultStep result
                        && !result.isError().orElse(false)
                        && !result.result().orElse(List.of()).isEmpty());
        if (!searched) {
            throw new IllegalStateException("Google Search returned no grounding evidence. Please try again.");
        }

        String json = extractOutputText(interaction);

        return parseOutput(json, safeFactChecks, modelName);
    }

    AiVerificationOutput parseOutput(String json, List<FactCheckMatchDto> safeFactChecks, String modelName) {
        GeminiStructuredResponse parsed;
        try {
            parsed = objectMapper.readValue(json, GeminiStructuredResponse.class);
        } catch (tools.jackson.core.JacksonException ex) {
            throw new IllegalStateException("Google verification returned an incomplete or invalid report.", ex);
        }
        if (parsed == null
                || (!"en".equals(parsed.language()) && !"fil".equals(parsed.language()))
                || parsed.overallVerdict() == null
                || !validConfidence(parsed.confidence())
                || parsed.summary() == null
                || parsed.summary().isBlank()
                || parsed.claims() == null
                || parsed.claims().isEmpty()
                || parsed.claims().size() > 4
                || parsed.claims().stream()
                        .anyMatch(claim -> claim == null
                                || claim.claim() == null
                                || claim.claim().isBlank()
                                || claim.verdict() == null
                                || claim.verdict() == Verdict.SATIRE_OR_OPINION
                                || !validConfidence(claim.confidence())
                                || claim.explanation() == null
                                || claim.explanation().isBlank())) {
            throw new IllegalStateException("Google verification returned an incomplete or invalid report.");
        }
        List<ClaimDto> enrichedClaims = (parsed.claims() != null ? parsed.claims() : List.<RawClaim>of())
                .stream()
                        .map(raw -> new ClaimDto(
                                raw.claim(),
                                raw.verdict(),
                                raw.confidence(),
                                raw.explanation(),
                                sanitizeSources(raw.sources()),
                                safeFactChecks))
                        .toList();

        return new AiVerificationOutput(
                parsed.language(),
                parsed.overallVerdict(),
                parsed.confidence(),
                parsed.summary(),
                enrichedClaims,
                parsed.redFlags() != null ? parsed.redFlags() : List.of(),
                modelName + GROUNDED_VERSION_SUFFIX);
    }

    private boolean validConfidence(double confidence) {
        return Double.isFinite(confidence) && confidence >= 0 && confidence <= 1;
    }

    private AiVerificationOutput analyzeGemini25(
            String text, List<ValidatedImage> images, List<FactCheckMatchDto> factChecks, String modelName) {
        // Gemini 2.5 cannot combine Search with constrained JSON response mode.
        // Request JSON in the prompt while retaining the search tool and validate it locally.
        String prompt = buildPromptInput(text, images.size(), factChecks)
                + "\nReturn exactly one JSON object matching this schema, without markdown or citation markers outside JSON strings:\n"
                + objectMapper.writeValueAsString(PromptTemplates.verificationSchema());
        List<com.google.genai.types.Part> parts = new ArrayList<>();
        parts.add(com.google.genai.types.Part.fromText(prompt));
        for (ValidatedImage image : images) {
            parts.add(com.google.genai.types.Part.fromBytes(image.bytes(), image.mimeType()));
        }
        com.google.genai.types.GenerateContentConfig config = com.google.genai.types.GenerateContentConfig.builder()
                .systemInstruction(com.google.genai.types.Content.fromParts(
                        com.google.genai.types.Part.fromText(PromptTemplates.SYSTEM_INSTRUCTION)))
                .tools(com.google.genai.types.Tool.builder()
                        .googleSearch(
                                com.google.genai.types.GoogleSearch.builder().build())
                        .build())
                .thinkingConfig(com.google.genai.types.ThinkingConfig.builder()
                        .thinkingBudget(0)
                        .build())
                .build();
        GroundedContentRequest request = new GroundedContentRequest(
                modelName,
                com.google.genai.types.Content.builder()
                        .role("user")
                        .parts(parts)
                        .build(),
                config);
        com.google.genai.types.GenerateContentResponse response =
                requestWithDeadline(() -> generateContent.apply(request));
        com.google.genai.types.Candidate candidate = response.candidates().orElse(List.of()).stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Google verification returned no candidates"));
        if (candidate
                .finishReason()
                .filter(reason -> reason.knownEnum() == com.google.genai.types.FinishReason.Known.STOP)
                .isEmpty()) {
            throw new IllegalStateException("Google Search verification did not complete. Please try again.");
        }
        com.google.genai.types.GroundingMetadata grounding = candidate
                .groundingMetadata()
                .orElseThrow(() -> new IllegalStateException("Google Search returned no grounding evidence."));
        boolean hasWebSource = grounding.groundingChunks().orElse(List.of()).stream()
                .anyMatch(chunk -> chunk.web()
                        .flatMap(com.google.genai.types.GroundingChunkWeb::uri)
                        .filter(url -> url.startsWith("https://") || url.startsWith("http://"))
                        .isPresent());
        if (grounding.webSearchQueries().orElse(List.of()).isEmpty() || !hasWebSource) {
            throw new IllegalStateException("Google Search returned no grounding evidence.");
        }
        String json = candidate.content().flatMap(com.google.genai.types.Content::parts).orElse(List.of()).stream()
                .filter(part -> !part.thought().orElse(false))
                .flatMap(part -> part.text().stream())
                .collect(java.util.stream.Collectors.joining())
                .trim();
        if (json.startsWith("```")) {
            int firstNewline = json.indexOf('\n');
            if (firstNewline >= 0 && json.endsWith("```")) {
                json = json.substring(firstNewline + 1, json.length() - 3).trim();
            }
        }
        return parseOutput(json, factChecks, modelName);
    }

    record GroundedContentRequest(
            String model,
            com.google.genai.types.Content content,
            com.google.genai.types.GenerateContentConfig config) {}

    com.google.genai.types.GenerateContentResponse generateStructuredContent(GroundedContentRequest request) {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            throw new IllegalStateException("Gemini is not configured");
        }
        return generateContent.apply(request);
    }

    <T> T requestWithDeadline(java.util.concurrent.Callable<T> operation) {
        FutureTask<T> request = new FutureTask<>(operation);
        Thread.ofVirtual().name("gemini-verification").start(request);
        try {
            return request.get(properties.requestTimeout().toMillis(), TimeUnit.MILLISECONDS);
        } catch (TimeoutException ex) {
            request.cancel(true);
            throw new VerificationTimeoutException();
        } catch (InterruptedException ex) {
            request.cancel(true);
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Verification was interrupted.", ex);
        } catch (ExecutionException ex) {
            if (ex.getCause() instanceof com.google.genai.errors.ApiException apiError && apiError.code() == 404) {
                throw new VerificationModelUnavailableException();
            }
            if (ex.getCause() instanceof RuntimeException cause) {
                throw cause;
            }
            throw new IllegalStateException("Google verification request failed.", ex.getCause());
        }
    }

    String buildPromptInput(String text, int imageCount, List<FactCheckMatchDto> factChecks) {
        StringBuilder sb = new StringBuilder();
        if (!text.isBlank()) {
            sb.append("<article>\n").append(text).append("\n</article>");
        } else if (imageCount > 0) {
            sb.append(
                    "<article>\nExtract and verify the factual claims shown in the attached image(s)/screenshot(s).\n</article>");
        }
        if (!factChecks.isEmpty()) {
            sb.append("\n\n<known_fact_checks>\n");
            for (FactCheckMatchDto fc : factChecks) {
                sb.append("- Claim: ")
                        .append(fc.claimText())
                        .append(" | Rating: ")
                        .append(fc.textualRating())
                        .append(" | Publisher: ")
                        .append(fc.publisher())
                        .append(" | URL: ")
                        .append(fc.url())
                        .append("\n");
            }
            sb.append("</known_fact_checks>");
        }
        return sb.toString();
    }

    private List<SourceDto> sanitizeSources(List<SourceDto> sources) {
        if (sources == null) {
            return List.of();
        }
        return sources.stream()
                .filter(s -> s != null
                        && s.url() != null
                        && (s.url().startsWith("https://") || s.url().startsWith("http://")))
                .toList();
    }

    private String extractOutputText(Interaction interaction) {
        String direct = interaction.outputText().orElse("");
        if (!direct.isBlank()) {
            return direct;
        }

        StringBuilder text = new StringBuilder();
        for (Step step : interaction.steps().orElse(List.of())) {
            if (step instanceof ModelOutputStep modelOutput) {
                for (Content content : modelOutput.content().orElse(List.of())) {
                    if (content instanceof TextContent textContent) {
                        text.append(textContent.text().orElse(""));
                    }
                }
            }
        }

        if (text.isEmpty()) {
            log.warn("Gemini returned no text output.");
            throw new IllegalStateException("Empty output text from Gemini API");
        }
        return text.toString();
    }

    private record RawClaim(
            String claim, Verdict verdict, double confidence, String explanation, List<SourceDto> sources) {}

    private record GeminiStructuredResponse(
            String language,
            Verdict overallVerdict,
            double confidence,
            String summary,
            List<RawClaim> claims,
            List<String> redFlags) {}
}
