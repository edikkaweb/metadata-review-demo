# Metadata Review Kit · v1.0.2

Open bilingual working files for reviewing title tags and meta descriptions. Human-readable sources: the Edikka guide in [French](https://www.edikka.com/insights/ia-automatisation-web/automatiser-meta-title-description), its [English edition](https://www.edikka.com/en/insights/ai-web-automation/automating-meta-titles-descriptions), and the [Library record](https://www.edikka.com/bibliotheque#instrument-metadata-review-kit). Licence: CC BY 4.0.

Fichiers de travail bilingues et ouverts pour relire les balises title et meta descriptions. Sources humaines : le guide Edikka [français](https://www.edikka.com/insights/ia-automatisation-web/automatiser-meta-title-description), son [édition anglaise](https://www.edikka.com/en/insights/ai-web-automation/automating-meta-titles-descriptions) et la [fiche Bibliothèque](https://www.edikka.com/bibliotheque#instrument-metadata-review-kit). Licence : CC BY 4.0.

## Files · Fichiers

- `review-template.csv`: operational decision, provenance, review, lock and rollback record; one row per URL and proposal.
- `serp-observation-template.csv`: blank manual search-result observation sheet. It does not scrape Google.
- `search-console-observation-template.csv`: blank T0, J+28 and J+90 Search Console observation record.
- `pages.json`: declared six-page Edikka corpus used by the extractor.
- `corpus-edikka-2026-09-22.csv`: dated public-production extraction made before this local release; it is not silently rewritten as post-publication evidence.
- `extract-metadata-corpus.mjs`: dependency-free, read-only extractor; no AI call and no CMS write.
- `manifest.json`: version, method, limitations, file formats, byte sizes and SHA-256 fingerprints.
- `LICENSE.txt`: reuse terms.

## Decision and provenance fields · Décision et provenance

`generation_mode` accepts `manual`, `deterministic_template`, `template_rules`, `llm` or `hybrid`. When an LLM is involved, record `provider` and `model_id` only when the orchestration layer can obtain them reliably. Never infer a model version. `contract_version`, `ruleset_version`, `prompt_version`, `generated_at`, `source_hash` and optional `output_hash` explain how a proposal was produced and replayed.

Le contrat parent conserve les décisions machine `draft`, `rejected` et `human_review_required`. Le fichier de revue consigne ensuite les états éditoriaux `pending_review`, `approved`, `approved_with_edits`, `locked`, `review_required`, `stale`, `no_change` et `rolled_back`. Le motif `insufficient_evidence` accompagne `human_review_required` : aucune proposition n’est générée, la valeur existante est conservée et la ligne part en revue.

`machine_flags` stores deterministic or heuristic warnings, never a quality score. A similarity alert is a review candidate, not an SEO verdict. `manual_lock` prevents silent overwrite. `stale` means the recorded source fingerprint no longer matches; it does not prove the metadata is wrong. `rollback_ref` identifies a recoverable previous value or release.

## Observation plan · Plan d’observation

- `T0`, after publication: inspect both URLs in Search Console, verify Google-selected canonical and indexability, record the initial state, then begin manual SERP observations.
- `J+28`: compare impressions, clicks, CTR, position, queries, country and device while declaring concurrent changes.
- `J+90`: repeat only when volume supports interpretation.

Unobserved SERP and Search Console fields stay empty. Human decisions remain `pending_review` until a named person performs them. The templates contain no invented clicks, CTR, positions, acceptance rate, time saving or ranking effect.

## Resource identity · Identité des ressources

The kit is a `DigitalDocument` (a kind of `CreativeWork`) with documentary and software parts. Only the dated, populated corpus CSV is a `Dataset` distribution. Blank templates, the README, script, input URL list and licence are associated kit parts, not alternate downloads of that dataset. Dataset identity: https://www.edikka.com/bibliotheque#dataset-metadata-corpus-2026-09-22.

Le kit est un `DigitalDocument` (sous-type de `CreativeWork`) composé de documents et de code. Seul le CSV daté contenant les observations du corpus est une distribution du `Dataset`. Les gabarits vierges, le README, le script, la liste d’URL et la licence restent des parties du kit. La version 1.0.2 clarifie cette distinction sans modifier le corpus collecté. Le rejeu ci-dessous écrit un autre fichier et ne remplace pas ce corpus figé.

## Reproduction · Reproduction

```sh
node scripts/extract-metadata-corpus.mjs \
  --input=docbd/data/metadata-review-kit-v1/pages.json \
  --output=/tmp/edikka-metadata-corpus-replay.csv
node scripts/tests/metadata-corpus.test.mjs
```

Omit `--origin` to replay the canonical public URLs. To replay the declared paths against `https://edikka:8890`, add `--origin=https://edikka:8890` and configure Node with the trusted development CA, for example `NODE_EXTRA_CA_CERTS=/absolute/path/to/development-ca.pem`. Do not disable TLS verification. The extractor records URL, locale, page type, HTML title, meta description, H1, canonical, indicative character lengths, a SHA-256 fingerprint, exact duplicates and normalised word-bigram Jaccard similarity alerts at the threshold declared in the output.

The published corpus is a bounded six-page Edikka example, not a sample of the Web. It reports no Google result observation, Search Console metric, acceptance rate, CTR effect or ranking effect.

## Suggested citation · Citation suggérée

Bertrand Morel (2026). *Edikka Metadata Review Kit / Kit de revue des métadonnées* (v1.0.2). Edikka. CC BY 4.0. https://www.edikka.com/bibliotheque#instrument-metadata-review-kit
