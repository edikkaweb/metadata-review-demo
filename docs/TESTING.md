# Verification record — 1 October 2026

## Local candidate

- `npm run verify`: eight original manifest files and separate parent contract intact; six rows, all pending_review; each historic four-field SHA-256 recomputed exactly.
- `npm test`: **20 tests passed**, no failures in the final run. Integrity/CSV, both hash boundaries, Jaccard against the unchanged published extractor, threshold boundaries, missing/contradictory/supporting evidence, free text, correction, locks, approval invalidation, rejection preservation, no_change, reset, export fidelity, safe CSV and public preset links.
- The first test run had one incorrectly constructed synthetic threshold assertion. Its pair scored above 0.72; replaced with explicit 5/7 and 6/8 boundary pairs. Engine equivalence with the reference implementation was preserved.
- `npm run build`: FR and EN static HTML plus bundled sources/data/assets under the Pages subpath; build manifest generated.
- CLI exported and replayed the `changed` / `cosmetic` state successfully, with approval invalidated and no contradictory claim.

## Browser observations (Codex in-app browser)

- Desktop viewport 1440 × 1000: initial source, proposal and unsupported terms visible together; correction removes specific promise flags but leaves editorial review required.
- Enter activation: correct, approve with reason, then editing the title invalidates the approval. Free text remains explicitly unevaluated.
- Locked scenario: simulated application preserves the existing value and reports locked_preserved.
- Changed evidence: cosmetic change invalidates approval without contradictory-fact flags; material change adds those flags.
- JSON export: rendered JSON parsed and inspected; kind educational_simulation, exact evidence variant, stale approval and real export time; native download link and correct filename present.
- Interface switched to English while retaining French scenario values and decision. First real corpus record opened with Enter: French original title retained, all six records present.
- Mobile 390 × 844: document width equals 390; no page-wide horizontal scrolling. Keyboard Tab exposes a solid focus outline; Enter activates the free-only preset. Explicitly documented free fact resolves bounded claim flags without approval.
- Public-preset local URL restored in a new tab: matching source/proposal, no visitor approval or reason transmitted.
- Unchanged case replayed twice: no_change, same editorial version; CSV header matches the original 28-column template, download filename present.
- Scripts blocked by local CSP: controls disabled, source/example/corpus/method remain in initial HTML; native evidence details opens with Enter.

## Limits

These are targeted observations, not WCAG certification. No screen reader, physical mobile device, exhaustive browser/OS matrix or Safari/Firefox test was performed. Native controls were checked with Tab/Enter and explicit selections, not every possible keyboard sequence. This record distinguishes available JSON/CSV content and download links from any unobserved browser-specific save dialog. No SERP, Search Console, ranking, CTR or editorial acceptance metric was measured. All fictional decisions are labelled, never attributed to a real reviewer.

Production verification is recorded separately in the Edikka mission receipt; do not infer publication from this local record or a successful build alone.
