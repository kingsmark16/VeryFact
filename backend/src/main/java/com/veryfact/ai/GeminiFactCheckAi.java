package com.veryfact.ai;

import com.google.genai.Client;
import com.google.genai.gaos.models.interactions.Content;
import com.google.genai.gaos.models.interactions.CreateModelInteraction;
import com.google.genai.gaos.models.interactions.CreateModelInteractionResponseFormat;
import com.google.genai.gaos.models.interactions.GoogleSearch;
import com.google.genai.gaos.models.interactions.Interaction;
import com.google.genai.gaos.models.interactions.InteractionsInput;
import com.google.genai.gaos.models.interactions.Model;
import com.google.genai.gaos.models.interactions.ModelOutputStep;
import com.google.genai.gaos.models.interactions.ResponseFormat;
import com.google.genai.gaos.models.interactions.Step;
import com.google.genai.gaos.models.interactions.TextContent;
import com.google.genai.gaos.models.interactions.TextResponseFormat;
import com.google.genai.gaos.models.interactions.TextResponseFormatMimeType;
import com.google.genai.gaos.models.operations.CreateInteractionRequestBody;
import com.veryfact.check.domain.Verdict;
import com.veryfact.check.dto.ClaimDto;
import com.veryfact.check.dto.FactCheckMatchDto;
import com.veryfact.check.dto.SourceDto;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class GeminiFactCheckAi implements FactCheckAi {

    private static final Logger log = LoggerFactory.getLogger(GeminiFactCheckAi.class);

    private final GeminiProperties properties;
    private final ObjectMapper objectMapper;

    public GeminiFactCheckAi(GeminiProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    public AiVerificationOutput analyzeText(String text, List<FactCheckMatchDto> factChecks) {
        List<FactCheckMatchDto> safeFactChecks = factChecks != null ? factChecks : List.of();
        String modelName =
                properties.model() == null || properties.model().isBlank() ? "gemini-3.8-flash" : properties.model();

        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            log.info("GEMINI_API_KEY is not configured; returning local demo verification output.");
            return fallbackDemoOutput(text, safeFactChecks, modelName + "-demo");
        }

        Client client = Client.builder().apiKey(properties.apiKey()).build();

        CreateModelInteractionResponseFormat responseFormat =
                CreateModelInteractionResponseFormat.of(ResponseFormat.of(TextResponseFormat.builder()
                        .mimeType(TextResponseFormatMimeType.APPLICATION_JSON)
                        .schema(PromptTemplates.verificationSchema())
                        .build()));

        String safeInput = buildPromptInput(text, safeFactChecks);

        CreateModelInteraction params = CreateModelInteraction.builder()
                .model(Model.of(modelName))
                .systemInstruction(PromptTemplates.SYSTEM_INSTRUCTION)
                .input(InteractionsInput.of(safeInput))
                .tools(List.of(new GoogleSearch()))
                .responseFormat(responseFormat)
                .build();

        Interaction interaction = client.interactions
                .create(CreateInteractionRequestBody.of(params))
                .interaction()
                .orElseThrow(() -> new IllegalStateException("No interaction returned from Gemini API"));

        String json = extractOutputText(interaction);

        GeminiStructuredResponse parsed = objectMapper.readValue(json, GeminiStructuredResponse.class);
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
                modelName);
    }

    private String buildPromptInput(String text, List<FactCheckMatchDto> factChecks) {
        StringBuilder sb = new StringBuilder("<article>\n").append(text).append("\n</article>");
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
            log.error(
                    "Gemini returned no text. status={}, errors={}",
                    interaction.status().map(Object::toString).orElse("unknown"),
                    interaction.errors().map(Object::toString).orElse("none"));
            throw new IllegalStateException("Empty output text from Gemini API");
        }
        return text.toString();
    }

    private AiVerificationOutput fallbackDemoOutput(
            String text, List<FactCheckMatchDto> factChecks, String modelVersion) {
        String preview = text.length() > 140 ? text.substring(0, 140) + "..." : text;
        return new AiVerificationOutput(
                "en",
                Verdict.UNVERIFIABLE,
                0.65,
                "Demo mode active (set GEMINI_API_KEY in .env for live Gemini 3.8 Flash analysis). Checked excerpt: "
                        + preview,
                List.of(new ClaimDto(
                        preview,
                        Verdict.UNVERIFIABLE,
                        0.65,
                        "Set GEMINI_API_KEY to verify this claim with Gemini 3.8 Flash.",
                        List.of(new SourceDto("Google AI Studio", "https://aistudio.google.com/app/apikey", "Google")),
                        factChecks)),
                List.of("Demo fallback response — live AI key not configured yet"),
                modelVersion);
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
