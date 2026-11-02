# Separate Google search retrieval from Gemini generation

Date: 2026-11-02

## Context

The user requires Google Search results and no paid API services. Their Google
project accepts Gemini 3.5 Flash-Lite basic generation but rejects native Search
grounding. Both Gemini 2.5 models reject the project as unavailable to new users.
Live API Search setup also failed while a tool-free Live setup succeeded.
The user configured a SerpApi key after being told that queries would go through
this separate provider. The account API confirmed Free Plan, 250 searches/month.

## Decision

Default `GOOGLE_SEARCH_PROVIDER` to `serpapi` and use `gemini-3.5-flash-lite`.
Gemini first prepares one query (two only for unrelated central claims), including
image understanding where needed. SerpApi retrieves Google organic results with
`engine=google` and `no_cache=true`. The backend deduplicates results and attempts
to fetch up to three pages through the existing SSRF-protected article extractor.
Each page contributes at most 5,000 characters. Search snippets remain explicitly
distinguished from retrieved page text.

A second Gemini request evaluates the supplied evidence using constrained JSON.
Both Gemini calls omit built-in tools. Each cited URL must occur in the Google
results; source titles and publishers come from actual result metadata. Empty
results, quota failures, absent configuration, invalid output, and invented
citations fail visibly. The whole planning/search/retrieval/report operation is
bounded by the existing configured deadline (60 seconds by default).

There is no automatic native-grounding fallback or subscription upgrade. Native
Gemini grounding remains an explicit `GOOGLE_SEARCH_PROVIDER=gemini` option.
Unknown provider names fail configuration validation. The HTTP API is unchanged.

## Consequences

An uncached check uses two Gemini requests and one or two SerpApi searches.
The 250-search allowance is not 250 guaranteed reports: multi-query checks use
more than one search, and account usage elsewhere counts too. The project's
Gemini limits also apply. Existing one-hour report caching still applies.
Search queries are sent to SerpApi and Google, submissions/images to Gemini, and
page requests to source publishers; no queries, user content, or keys are logged.
No paid billing was enabled. Availability and free allowances may change.

## Validation

Mocked tests cover Google engine selection, fresh search, secret-safe failures,
quota/missing-key behavior, tool-free generation, images, duplicate queries,
retrieved pages, absent sources, and rejection of invented citations.
A manual local check of WHO's 5 May 2023 emergency announcement completed in
about 9.4 seconds and returned source URLs. This is one sample, not a latency
guarantee. The account was confirmed on the free plan before the live check.

References:
- https://serpapi.com/pricing
- https://serpapi.com/search-api
- https://serpapi.com/account-api
