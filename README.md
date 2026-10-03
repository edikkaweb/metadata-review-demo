# Peut-on publier ce titre ? / Can we publish this title?

**[Démonstration FR](https://edikkaweb.github.io/metadata-review-demo/) · [English demo](https://edikkaweb.github.io/metadata-review-demo/index-en.html)**

Examinez les sources, les contrôles et la décision éditoriale. Exemple initial : une entreprise fictive, **Atelier Orbe**, décrit un audit, son rapport et sa restitution. Une proposition ajoute « gratuit en 24 h » sans preuve de tarif ni délai. Retirer ces promesses fait disparaître les alertes correspondantes, mais n'approuve pas automatiquement le titre.

Examine sources, checks and editorial decisions. The initial fictional case adds “free within 24 hours” to an audit offer without price or timing evidence. Removing these promises resolves their specific flags; it does not automatically approve the title.

![Aperçu de la démonstration Edikka](docs/preview.jpg)

## Two separate spaces / Deux espaces distincts

- Five editable fictional scenarios: unsupported promise, similar titles, protected metadata, changed evidence, and unchanged replay. Bilingual source variants, structured facts, expected initial outcomes and explanations are published in [data/scenarios.json](data/scenarios.json).
- Six **read-only real Edikka observations**, dated **22 September 2026**, kit **1.0.2**. Their `pending_review` decisions and original values never change. No full historical page body is available in this corpus. Opening a current URL does not open a September archive.

Demo **1.0.0**, rules **1.0.0**. Browser-only state in memory. No account, API, model call, tracker, local storage or CMS write. Only static files from the demo are loaded; normal operation does not query edikka.com. Free text is not put in share links. UI language can change while preserving scenario content and decisions; selecting another case starts its fictional content in the current interface language.

## Run / Exécuter

Node.js 22 or later, no dependencies.

```sh
npm run verify    # frozen originals, bytes, hashes, six CSV rows and four-field hashes
npm test          # risk-based engine tests, no network
npm run build     # static FR/EN HTML, assets, bundled data and manifest
npm start         # http://127.0.0.1:4186/metadata-review-demo/
node src/replay.mjs promise --source=free --proposal=free
node src/replay.mjs unchanged --apply=true
node src/replay.mjs /path/to/exported-session.json
```

`npm run import` downloads the public kit and parent contract, verifies the manifest and **refuses** to replace an existing original with different bytes. It does not recrawl the six URLs. [Import provenance](data/provenance.json) records the actual import time, source URLs and hashes.

## What checks mean / Portée des contrôles

1. Deterministic facts: empty fields, recognised template variables, exact duplicates, lock state and version combination.
2. Heuristic flags: **the published extractor's exact algorithm**, normalised word-bigram set Jaccard at **0.72**, and explicitly limited lexical cues for free text.
3. Human review: consistency, intent, completeness and unevaluated claims. Known fixture claims are compared with structured facts, not inferred by word presence. A missing fact does not prove a false claim; “not free” is not evidence of “free”.

No global SEO score, automatic editorial validation, CTR claim or ranking prediction. Lengths are indicative. [Google title links](https://developers.google.com/search/docs/appearance/title-link) may use multiple sources; [snippets](https://developers.google.com/search/docs/appearance/snippet) may come from page content. Supplied tags do not guarantee display.

Similarity edge cases: one word creates a singleton; two empty sets yield 1; one empty set yields 0. Repeated bigrams collapse, accents remain distinct. Exact title equality is checked first. The published `plain` cleanup and entity decoding are retained exactly. This is not a language-independent semantic model or a cannibalisation detector.

## Versioned decisions / Décisions versionnées

Controls, visitor decision, lock, applied value and versions are separate. Explicit simulated approval binds **evidence + proposal + rules + scenario version + content language**. Editing title, description, evidence or rules invalidates it for the new combination. Locking prevents overwriting, not staleness. Rejecting or requesting evidence preserves the existing value. A valid unchanged replay returns `no_change` without a new editorial version.

Cases C, D and E include clearly identified fictional preconditions. No approval is attributed to Bertrand Morel or any invented real reviewer. Visitor actions have real local timestamps, with actor `visitor_simulation`, not a fabricated identity.

## Fingerprints and export / Empreintes et export

Historical `source_hash` is SHA-256 of `[title, description, h1, canonical].join('\n')`, UTF-8. **It is not full HTML.** A body paragraph or price change can leave this hash unchanged.

The separate scenario evidence hash covers `{scenario, scenarioVersion, locale, evidence}` using recursively sorted object keys, preserved array order, JSON string escaping, UTF-8 and SHA-256. Evidence includes text, structured facts, unknowns and any condition or compared pages. Proposal and approval-combination hashes are distinct. See [reproduction](docs/REPRODUCTION.md).

JSON preserves exact inputs, controls, state, history and provenance, explicitly as `educational_simulation`. It uses its **own session schema identity**, not the [parent recommendation contract](originals/parent-contract.schema.json). We do not claim parent-contract validation.

CSV follows the original review-template columns. It prefixes spreadsheet-dangerous cells with `'`; exact text remains in JSON. `source_hash`, `output_hash`, provider, model, prompt, generation time and reviewer fields stay empty when not actually known. `human_decision` is prefixed `simulation:`; `batch_id` is `fictional:<case>:<version>`. These deliberate simulation markers mean the CSV is a pedagogical adaptation, not an approved operational review record.

Share links contain only public scenario ID, documented evidence/proposal variant IDs, content language and version. They exclude free text, visitor approvals, history and reasons. An edited session can be exported, not silently embedded in a URL.

## Files

`originals/`: unchanged public kit + separately saved parent contract. `data/`: import provenance and derived bilingual scenario catalogue. `src/core.mjs`: CSV, hashing, similarity. `src/scenarios.mjs`: bounded fixtures. `src/engine.mjs`: controls and pure transitions. `src/render.mjs`, `src/app.mjs`, `src/style.css`: presentation. `dist/`: generated Pages site, with static essential HTML and six corpus observations. Tests are independent of the DOM.

## Verification and limits

See [actual verification record](docs/TESTING.md), [reproduction](docs/REPRODUCTION.md) and [changelog](CHANGELOG.md). No screen-reader testing or broad WCAG certification is implied. Passing checks does not prove truth or publication readiness.

## Sources and licences

[Edikka kit and library](https://www.edikka.com/bibliotheque#instrument-metadata-review-kit) · [article FR](https://www.edikka.com/insights/ia-automatisation-web/automatiser-meta-title-description) · [article EN](https://www.edikka.com/en/insights/ai-web-automation/automating-meta-titles-descriptions).

Original kit resources © Edikka, **CC BY 4.0**; preserve [original licence](originals/LICENSE.txt). The licence text still says 1.0.0; the manifest declares 1.0.2, and originals are not rewritten to conceal that difference. New demonstration code and fictional scenarios: **MIT**, see [LICENSE](LICENSE). Cite Bertrand Morel / Edikka for imported data, with kit version and access date from provenance.

[Contribuer / Contributing](CONTRIBUTING.md) · [Toutes les démonstrations / All experiments](https://edikkaweb.github.io/)

La détection automatique de GitHub peut afficher « Other » : le fichier LICENSE conserve les exclusions des archives, composants tiers et marques. Le code original reste sous MIT dans le périmètre indiqué. / GitHub may show “Other”; the existing licence scopes and exclusions remain authoritative.
