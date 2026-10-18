# VeryFact — Product Specification

VeryFact is a public, account-free fake-news checker. A visitor submits pasted text, an article URL, or one or more images/screenshots. The backend extracts factual claims, checks them against professional fact-checks (Google Fact Check Tools API) and live web evidence (Gemini 3.8 Flash + Google Search grounding), and returns a verdict for each claim plus an overall verdict with cited sources.

## Technical & Product Decisions

| Area | Choice |
|---|---|
| AI engine | Google Gemini API, model `gemini-3.8-flash`, official Java SDK `com.google.genai:google-genai` |
| Inputs | Text, URL, single image, multiple images (max 4 × 5 MB, jpeg/png/webp; text ≤ 20,000 chars) |
| Evidence | Google Search grounding + Google Fact Check Tools API |
| Persistence | PostgreSQL 18, shareable `/r/{slug}`, cache keyed on SHA-256 content hash |
| Abuse protection | Per-IP rate limiting (Bucket4j, 10 checks/hour), plus input size and file-type limits |
| Languages | English + Filipino/Tagalog (UI and AI output) |
| Frontend | React 19 + Vite 8 + TypeScript + Tailwind CSS v4 + shadcn/ui |
| Backend | Spring Boot 4.1.1 on Java 25 (Maven) |
| Run target | Docker Compose locally, deploy-ready later |

## Verdict Model

- **Per claim:** `TRUE | MOSTLY_TRUE | MIXED | MOSTLY_FALSE | FALSE | UNVERIFIABLE`, plus `confidence` (0–1), `explanation`, `sources[]`, `factChecks[]`
- **Overall:** the same scale plus `SATIRE_OR_OPINION`, plus `summary`, `redFlags[]` (e.g. sensational language, missing author or date, manipulated-image hints), `language` (`en` / `fil`)

## Pages & Components

| Route | Page | Key components |
|---|---|---|
| `/` | `CheckPage` | `InputTabs` (Text / URL / Images), `ImageDropzone` (drag-drop, paste from clipboard, previews, max 4), `SubmitButton`, `DisclaimerNote` |
| `/r/:slug` | `ResultPage` | `ProgressSteps` (Extracting → Finding claims → Searching fact-checks → Verifying → Done), `VerdictBadge`, `OverallSummaryCard`, `ClaimCard[]` (verdict, confidence bar, explanation, sources, fact-check matches), `RedFlagsList`, `ShareButton` |
| `*` | `NotFoundPage` | Friendly 404 page |

