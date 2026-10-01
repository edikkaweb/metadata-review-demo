# Reproduire / Reproduce

Requires Node.js >=22, no package installation. Clone this repository, then run `npm run verify`, `npm test`, `npm run build`, `npm start` in that order. The local URL includes `/metadata-review-demo/`, matching GitHub Pages.

## Five documented cases

| Case | Initial expected application | What to try |
| --- | --- | --- |
| `promise` | `human_review_required`, existing value retained | `free` source + `free` proposal supports the bounded free claim; `paid` contradicts it; `corrected` removes both promises without approving |
| `similar` | `human_review_required` | Jaccard >=0.72 in FR and EN; `overlap` changes documented intent, not the similarity score |
| `locked` | `locked_preserved` | Unlock with a reason, review, approve explicitly, apply; existing remains protected until then |
| `changed` | `no_change` under the fictional initial approval | `material` and `cosmetic` evidence both invalidate approval; only `material` contradicts the promised facts |
| `unchanged` | `no_change` | Repeated application leaves editorial version 1; a log entry is not a new editorial version |

CLI examples:

```sh
node src/replay.mjs promise --lang=en --source=paid --proposal=free
node src/replay.mjs changed --source=cosmetic --apply=true
node src/replay.mjs unchanged --apply=true
node src/replay.mjs /absolute/path/to/edikka-simulation-changed.json
```

The last command recalculates controls and hashes with the same engine and compares them with the export. It detects mismatches, not the authenticity of an asserted human decision. No import is executed as HTML or JavaScript. Browser arbitrary-session import is intentionally absent.

## Exact hash boundaries

Historical corpus: SHA-256 of UTF-8 `title + '\n' + description + '\n' + h1 + '\n' + canonical`; no trailing newline. Four values only. Compare against every original `source_hash` with `npm run verify`.

Scenario: `canonical()` recursively sorts object keys lexicographically, preserves array order, and uses JSON string/number encoding without whitespace. SHA-256 then hashes those UTF-8 bytes. Evidence object keys: scenario, scenarioVersion, locale, evidence (id, text, facts, unknown; optional condition and otherPages). Proposal object: title and description. Approval combination: scenario, scenarioVersion, locale, evidence, proposal, rules. Hashes are exported separately with their method descriptions. They are integrity aids, not evidence of a real reviewer or timestamp authority.

## Exact similarity

Implementation is tested against the unchanged published `extract-metadata-corpus.mjs` for each selected synthetic case. Its `plain` strips tags, decodes its documented entities, collapses whitespace, then lowercases. Split into Unicode letter/number words. Two or more words create adjacent word bigrams in a set; one word stays a singleton. Jaccard = intersection size / union size; two empty sets return 1. Alert threshold is inclusive >=0.72. Test pairs straddle the threshold at 5/7 and 6/8. Archived flags remain exactly as observed, not recomputed into the original rows.

## Exports

JSON is the fidelity format. The session schema identifier is `edikka-metadata-simulation/1.0.0`, deliberately separate from the parent SEO recommendation contract. No parent-contract compliance is claimed. Unknown model, provider or actual reviewer information is never synthesised.

CSV uses the 28 original review headers. URL points to the reserved `.example` fictional company. Locale is scenario content language. Existing/proposed fields retain their meaning. Evidence contains the fictional evidence JSON. Machine flags are the current rule IDs. Human decision and batch IDs explicitly identify simulation. `source_hash` stays empty to avoid borrowing the historic four-field meaning for different evidence. A leading apostrophe protects cells beginning with formula-significant `= + - @` after whitespace, and leading tab/CR/LF. This changes CSV cell text deliberately; use JSON for exact strings. No Search Console or SERP data is invented.

## Offline and no script fallback

Normal operation loads only bundled static resources. Stop network access to edikka.com after the page loads: interaction needs none of its endpoints. For a local script-blocked inspection, open `http://127.0.0.1:4186/metadata-review-demo/?nojs=1`; the local server sends `script-src 'none'`. Essential example, corpus, method and source links remain in initial HTML. This is a CSP fallback test, not a claim about every browser's JavaScript setting.

## Deployment

GitHub Actions runs verification/tests/build, uploads only `dist/`, then deploys it to Pages. Configure repository Settings > Pages > GitHub Actions before running deployment. A green build alone is not proof of publication. Check FR, EN, a predefined deep link and actual served hashes against `dist/build-manifest.json`. No secret or CMS access is needed by this site.
