# VeryFact — Product specification

Last synchronized with the repository: 2026-11-02.

VeryFact is a public, account-free fact checker. Visitors submit content and receive a public report with verdicts and cited evidence. Completion time and accuracy are not guaranteed.

## Submission experience

The homepage centers a headline and one checking form below the navigation. It uses an editorial layout, locally bundled Inter typography, a blue primary action, and the custom `/Icon.png` logo/favicon.

| Mode        | Input and behavior                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Text        | Paste 20–20,000 characters; character count and clear action. Sent as JSON.                                                        |
| Article URL | Public HTTP(S) URL; optional text context up to 20,000 characters in a disclosure. Sent as multipart.                              |
| Screenshots | Select, drop, or paste up to four JPEG/PNG/WebP files, 5 MiB each; previews and removal; optional text context. Sent as multipart. |

Mode drafts are retained separately: text-mode content is not automatically included when submitting a URL or images. The API additionally accepts combined URL, images, and text; the homepage selects one primary mode. The backend derives the supported image MIME type from byte signatures rather than trusting the uploaded MIME declaration. Spring's total multipart request limit is 22 MB.

The form displays a public-content notice and prevents invalid submissions. After four seconds waiting for submission it shows a longer-wait message. Rate-limit responses show the retry delay; other submission failures use a generic message. Browser HTTP requests have a 90-second timeout.

Below the form, up to three recent completed reports link to their public pages. This section is hidden when no results are available. A three-part “How it works” section and AI limitation footer complete the page.

## Verification

The default pipeline uses Gemini `gemini-3.5-flash-lite` to prepare one or two queries, retrieves Google organic results through SerpApi, optionally fetches source pages, and asks Gemini to evaluate the evidence. Optional Google Fact Check Tools results supply published fact-check leads. Native Gemini Search is explicitly configurable, with no automatic fallback.

Each uncached default-path check uses two Gemini requests and one or two SerpApi searches. Required configuration, access, quotas, real search results, valid output, and valid citations must succeed. No demo reports are generated. Matching completed reports with a `-search-v1` provenance suffix and creation time within one hour can be reused; cache hits do not guarantee a fresh search.

## Pages and report behavior

| Route      | Implemented page                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| `/`        | `CheckPage`: submission form, recent reports, process explanation.                                   |
| `/r/:slug` | `ResultPage`: loading, completed report, failed check, unavailable report, or retriable fetch error. |
| `*`        | `NotFoundPage`: navigation back to the homepage.                                                     |

While pending/processing, the report polls every 1.5 seconds and shows a centered orbital animation with one server-activity message. The animation can pause without pausing verification. Reduced-motion preferences disable motion. No stage list, percentage, step count, or elapsed-time estimate is displayed. Initial fetching uses an opening message; unknown stages use a neutral status.

A completed report displays:

- Overall verdict and summary, with a link down to evidence.
- Claim count, unique safe citation URL count (including published fact-check links), and overall confidence with an explanation of its limitations.
- Collapsible submitted excerpt/original URL, notes when present, and numbered claim cards.
- Per-claim verdict, explanation, confidence, and evidence links. Evidence is expanded initially; sources and published fact-check matches have distinct presentation. Missing evidence has an explicit empty state.
- Filters for all, supported (`TRUE`, `MOSTLY_TRUE`), disputed (`FALSE`, `MOSTLY_FALSE`), and uncertain (remaining verdicts), when there is more than one claim. Original claim numbering survives filtering.
- Copy-link sharing; clipboard failure instructs the visitor to copy the browser URL manually.

HTTP(S) evidence links without embedded credentials open in a new tab. Headers do not show the slug or model-version badge, although those fields remain in the API. Completed/failed reports reset scroll to the top on first arrival or status transition. Completed reports focus the verdict without additional scrolling; filtering or refreshing the same completed state preserves scroll.

## Verdicts and language

The shared API enum is `TRUE`, `MOSTLY_TRUE`, `MIXED`, `MOSTLY_FALSE`, `FALSE`, `UNVERIFIABLE`, and `SATIRE_OR_OPINION`; both overall and claim DTOs use it. The AI generation schema restricts individual claims to the first six verdicts; `SATIRE_OR_OPINION` is an overall-report option. Confidence values are 0–1 and displayed as rounded percentages. They are model estimates, not independently calibrated accuracy scores.

English and Filipino resources cover the interface, loading, and reports. Initialization is fixed to English; no selector or browser-language detection is implemented. AI report language is returned as `en` or `fil` based on the submission and is independent of interface language. Backend failure strings remain English.

## Public data and limits

PostgreSQL stores excerpts, URLs, hashes, generated reports, provenance, and timestamps. Text excerpts are limited to 500 characters plus an ellipsis; URL-only/image-only submissions use a URL or image-count description. Uploaded images are not persisted. Generated claims/explanations may reproduce submitted text. Reports are public and may appear in the recent feed; there are no accounts, private reports, report deletion, or automatic retention cleanup.

Throttling defaults to 10 submission requests per hour per servlet remote address, using an in-memory fixed window and ephemeral salted hashes. It is per backend process, resets on restart, and includes cache-hit/invalid requests reaching the filter. Proxies can affect which remote address the limiter sees.

The AI operation defaults to a 60-second deadline (configurable up to 120 seconds); submitted-URL extraction and optional Fact Check lookup occur before it. Cleanup runs every 30 seconds and fails unfinished checks created more than five minutes earlier. Failures require a new submission; refreshing a failed report does not re-run verification.

Deployment, quotas, latency, and citation quality need validation in the target environment. See [architecture](ARCHITECTURE.md), [deployment](DEPLOYMENT.md), and [remaining work](BACKLOG.md).
