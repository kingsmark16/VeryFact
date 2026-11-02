# Gemini 2.5 Flash-Lite for limited free search grounding

Date: 2026-11-02

## Context

Gemini 3.5 Flash-Lite accepted basic generation with the configured key but
returned HTTP 429 when Google Search was enabled. Model quota in AI Studio was
nonzero. Google's pricing lists Gemini 3 Search grounding as unavailable on the
API free tier; Gemini 2.5 Flash-Lite has a limited free Search allowance. The
user selected the Gemini 2.5 free-tier route.

## Decision

Support explicitly configured `gemini-2.5-flash-lite`. Route Gemini 2.5 requests through generateContent
with `thinkingBudget=0`; retain the Interactions path for configured Gemini 3
models. Gemini 2.5 Search cannot be combined with constrained JSON response mode,
so provide the report schema in the prompt and validate the parsed JSON locally.
Allow a whole-response JSON code fence, but reject incomplete/invalid reports.
Do not add a second formatting request, ungrounded retries, or demo verdicts.

Require a STOP finish reason plus Google Search queries and HTTP(S) web sources
in grounding metadata. Preserve image inputs, the 60-second overall deadline,
and configured-model provenance. The HTTP API and database schema are unchanged.

## Consequences

There is one model request per uncached check. JSON adherence relies on prompting
and local validation rather than provider-constrained output. Inference quality
and model-specific quotas differ; the project's displayed limits remain binding.
The free-tier route still fails visibly if Search metadata is absent or quota is
exhausted. Model 3 requests still need API Search access when explicitly selected.

References:
- https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-lite
- https://ai.google.dev/gemini-api/docs/generate-content/thinking

## Live verification outcome

The project rejected both `gemini-2.5-flash-lite` and `gemini-2.5-flash` with
HTTP 404: no longer available to new users. Google documents that these models
are restricted to users who actively used them previously. The quota table
alone does not prove access. Retain Gemini 2.5 compatibility for eligible
projects, but default new installations to `gemini-3.5-flash-lite` and document
its Search billing requirement. The user's local `.env` retains their selected
2.5 model; runtime errors now explain model unavailability. No paid services
were enabled. Automated tests use mocks, not live providers.

Reference: https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite
