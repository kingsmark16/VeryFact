# 0005 - Clean editorial interface

**Status: Accepted; report/loading details subsequently amended by ADR 0006.**

Current behavior (2026-11-02): the custom Icon.png is used in navigation and the favicon. The home page displays at most three recent reports and hides that section without data. Interface and report resources now include English/Filipino copy, but initialization remains English with no selector. The packaging blocker/test count recorded below are historical validation observations, not current check results.

Date: 2026-11-02
Status: Accepted

## Context

The existing home page combined technical provider descriptions, terminal labels, a version badge, character-ring decoration, and dense feed cards. These elements competed with the core task of submitting content for verification. The requested direction is premium, clean, and concise.

## Decision

Use a restrained editorial layout: a warm neutral background, white form surface, blue primary action, locally bundled Inter typography, consistent spacing, and subtle borders. Preserve the existing logo. Keep a single primary action and three input modes; disclose optional context only when needed. Reduce the recent feed to three reports and retain a short explanation of the verification process.

Remove official/accredited language that could imply institutional authority. Keep the AI limitation and explain that submitted checks are public. Separate text-mode content from optional URL/image context to avoid unintentionally submitting another mode's draft.

Follow the frontend localization convention with i18next and English/Filipino resources for new interface copy. Existing report copy can be migrated incrementally. Use roving focus and arrow-key navigation for tabs, visible keyboard focus, semantic verdict colors with text labels, and reduced-motion support.

## Consequences

The home page prioritizes the checking task and reports emphasize findings and evidence. Optional context takes an extra disclosure action. Two small localization dependencies are added. No API contract or generated types change. Backend verification currently passes 51 tests but packaging is blocked by an existing locked JAR.
