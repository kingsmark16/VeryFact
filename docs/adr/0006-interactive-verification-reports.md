# 0006 - Interactive verification and evidence-first reports

## Current implementation (2026-11-02)

The loading simplification below supersedes the original document-scan animation,
explorable stage descriptions, and step console. `ProgressSteps` now displays one
orbital animation and one actual server-activity message. Pause/resume affects
animation alone; polling/status announcements continue. Reduced motion remains
supported. No stage list, count, percentage, tips, or elapsed-time estimate appears.

The evidence-first report remains implemented: verdict/summary, claim and unique
safe-URL counts, confidence explanation, original-number-preserving category
filters, expanded evidence, collapsible submission/notes, and clipboard fallback
instructions. Slug/model badges are absent from the header; both remain API fields.

Completed and failed reports reset scroll to the top before display on arrival or
status transition. Completed reports focus the verdict with `preventScroll`.
Filtering and refreshes in the same completed state preserve the current scroll.
Counts and claim/source numbers use no leading-zero padding. Interface resources
exist in English/Filipino; UI initialization is English without a language selector.

## Original decision and subsequent amendment

Date: 2026-11-02
Status: Accepted

## Context

The user requested redesigned loading/results with interaction and animation. The existing stage component used arbitrary percentages, technical copy, and duplicated progress indicators. Reports repeated confidence bars and nested badges while giving source links little space.

## Decision

Preserve the editorial homepage style and existing API. Loading displays only the stage reported by the server, with no elapsed-time guesses or fabricated percentages. Users can inspect any stage description without changing the actual active stage. A CSS document scan and magnifier animation communicates ongoing inspection; a pause control affects animation alone. Reduced-motion preferences disable animation, and a single live region announces stage updates.

Reports lead with the verdict and summary. Secondary statistics show claim counts, deduplicated safe citation URLs, and model confidence with an explicit explanation. Claims keep their original numbering when filtered. Filters include supported, disputed, and uncertain categories. Native details elements reveal evidence, submitted content, notes, and confidence context with keyboard support. Source links remain visible by default.

Use small CSS transform/opacity animations rather than adding an animation dependency. Respect reduced-motion globally and focus the verdict when an in-progress report completes. Localize interface strings in English and Filipino. Retain AI/source caveats and honest empty-source states. Do not change backend behavior or invent report data.

## Consequences

The waiting experience is interactive without manipulating verification progress. A short report entrance transition replaces the old stamp. Clipboard failures now offer a manual fallback. Browser QA uses an intercepted loading response in the test browser only; no preview reports or fake results are added to the application or database.

## Loading simplification (2026-11-02)

At the user's request, replace the explorable stage console and tips with one centered orbital visual and one current-activity message. Keep the real server stage as the sole status source; do not rotate through simulated tasks. The visual itself provides an accessible pause/resume control. No stage list, completed-step count, or estimated percentage is displayed.
