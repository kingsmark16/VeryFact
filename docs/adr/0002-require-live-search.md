# Require live Google Search evidence

Date: 2026-11-02

## Context

Verification retried provider failures without Google Search and could return
keyword-based demo verdicts with generic publisher links. Those outputs were
indistinguishable from real verification, and repeated model requests and sleeps
added latency. The optional Fact Check Tools request had no explicit timeout.

## Decision

- Keep one combined extraction/verification Gemini interaction with Google Search.
  Explicitly request current evidence and require a non-error, nonempty
  `google_search_result` step before accepting an answer.
- Never retry without Search or synthesize demo results. Provider failures become
  failed checks. Use the configured model rather than silently changing models.
- Reuse and close the Gemini client, use LOW thinking effort, and request concise
  explanations. This reduces avoidable work without removing web research.
- Bound optional Fact Check Tools connections to two seconds and response reads
  to three seconds; lookup failures continue to the required Google Search step.
- Mark confirmed-search results with the `-search-v1` model-version suffix. Reuse
  only these results for one hour; legacy results cannot establish search provenance.
- Describe loading as a search request and show stage counts instead of claiming
  an elapsed-work percentage. Keep raw provider errors out of public messages/logs.

## Consequences

Missing configuration, quota errors, and absent search evidence now visibly fail
instead of appearing successful. Older shared reports remain available, but new
submissions do not reuse them. Cached reports may be up to one hour old; a new
search is not guaranteed for an identical submission within that window.
Actual latency still depends on Google and must be measured after deployment.
Gemini requests have a configurable 60-second deadline (`GEMINI_REQUEST_TIMEOUT`,
maximum 120 seconds), matching HTTP timeouts, and no SDK retries. On deadline,
the waiting worker cancels the request task and records a failed check. Every
30 seconds, a database cleanup expires pending/processing checks older than
five minutes, including work abandoned by a restart. This assumes the bounded
pipeline completes well inside that interval. Fact Check Tools now requires an
explicit `GOOGLE_FACTCHECK_API_KEY`; the Gemini key is no longer reused there.
The search-result trace confirms tool execution, not the correctness of every
model-written citation or verdict. Lower thinking effort should be evaluated
against representative claims before making accuracy or speed claims.
