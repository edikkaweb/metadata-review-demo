import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  VERSIONS,
  parseCSV,
  digest,
  metadataFieldsHash,
  similarity,
  canonical,
} from "../src/core.mjs";
import {
  initialState,
  transition,
  controls,
  approvalCurrent,
  exportSession,
  reviewCSV,
  presetLink,
  stateFromHash,
  binding,
} from "../src/engine.mjs";
import { scenarios } from "../src/scenarios.mjs";
import { verify } from "../src/verify.mjs";
import {
  similarity as referenceSimilarity,
  parseMetadata,
} from "../originals/extract-metadata-corpus.mjs";
import { frameHTML } from "../src/render.mjs";
const at = "2026-10-01T00:00:00.000Z";
const act = (s, e) => transition(s, e, at);
const rule = (s, name) => controls(s).filter((x) => x.rule === name);
test("Original file integrity, six immutable observations, definitions and historic hashes", async () => {
  const d = await verify();
  assert.equal(d.rows.length, 6);
  assert.ok(d.rows.every((r) => r.human_decision === "pending_review"));
  assert.equal(d.manifest.version, "1.0.2");
  assert.equal(d.provenance.observedAt, "2026-09-22");
});
test("CSV supports quoted commas, CRLF, multiline and escaped quotes, rejects truncated input", () => {
  assert.deepEqual(parseCSV('a,b\r\n"a,b","line1\nline2"\r\n"x""y",""\r\n'), [
    { a: "a,b", b: "line1\nline2" },
    { a: 'x"y', b: "" },
  ]);
  assert.throws(() => parseCSV('a,b\n"x,y'));
  assert.throws(() => parseCSV("a,b\n1,2,3"));
});
test("Historic source_hash is exactly four fields, independent from page body and price", async () => {
  const a = parseMetadata(
    '<title>A</title><meta name="description" content="B"><h1>C</h1><link rel="canonical" href="https://example.com"><p>Price 20</p>',
  );
  const b = parseMetadata(
    '<title>A</title><meta name="description" content="B"><h1>C</h1><link rel="canonical" href="https://example.com"><p>Price 90</p>',
  );
  assert.equal(a.source_hash, b.source_hash);
  assert.equal(await metadataFieldsHash(a), a.source_hash);
  assert.notEqual(
    await metadataFieldsHash({ ...a, title: "D" }),
    a.source_hash,
  );
});
test("Scenario fingerprint serialisation is deterministic and covers body/facts separately", async () => {
  assert.equal(await digest({ a: 1, b: 2 }), await digest({ b: 2, a: 1 }));
  let s = initialState("changed");
  const a = await exportSession(s, {});
  s = act(s, { type: "source", id: "cosmetic" });
  const b = await exportSession(s, {});
  assert.notEqual(a.fingerprints.evidence, b.fingerprints.evidence);
  assert.equal(a.fingerprints.proposal, b.fingerprints.proposal);
  assert.equal(b.approvalCurrent, false);
});
test("Jaccard matches published extractor exactly including edge cases and threshold", () => {
  const cases = [
    ["", ""],
    ["", "a"],
    ["CHAT", "chat"],
    ["chat chat", "chat"],
    ["école", "ecole"],
    ["a b a b", "a b"],
    ["<b>audit</b> &amp; web", "audit web"],
    ["a b c d e f g", "a b c d e f x"],
    ["a b c d e f g h", "a b c d e f g x"],
  ];
  for (const [a, b] of cases)
    assert.equal(similarity(a, b), referenceSimilarity(a, b));
  assert.equal(similarity("", ""), 1);
  assert.equal(similarity("", "one"), 0);
  assert.ok(similarity(...cases[7]) < 0.72);
  assert.ok(similarity(...cases[8]) >= 0.72);
  for (const lang of ["fr", "en"])
    assert.equal(
      rule(initialState("similar", lang), "title_similarity").length,
      1,
    );
});
test("Missing, contradictory and explicitly supporting facts are distinct in both languages", () => {
  for (const lang of ["fr", "en"]) {
    let s = initialState("promise", lang);
    assert.equal(rule(s, "claim_unverified").length, 4);
    s = act(s, { type: "preset", id: "free" });
    s = act(s, { type: "source", id: "free" });
    assert.equal(rule(s, "claim_supported").length, 2);
    assert.equal(rule(s, "claim_unverified").length, 0);
    s = act(s, { type: "source", id: "paid" });
    assert.equal(rule(s, "claim_contradicted").length, 2);
    assert.equal(approvalCurrent(s), false);
  }
});
test("Known correction removes unsupported promises without automatic approval", () => {
  const s = act(initialState(), { type: "preset", id: "corrected" });
  assert.equal(rule(s, "claim_unverified").length, 0);
  assert.equal(approvalCurrent(s), false);
  assert.equal(act(s, { type: "apply" }).lastAction, "human_review_required");
});
test("Free text with no keyword and negative wording is never automatically validated", () => {
  for (const title of [
    "Notre audit révolutionne votre avenir",
    "Cet audit est non gratuit",
    "A perfectly normal description",
  ]) {
    let s = act(initialState(), {
      type: "edit",
      title,
      description: "A novel, unverified promise.",
    });
    assert.equal(rule(s, "free_text_not_evaluated").length, 2);
    assert.equal(rule(s, "claim_supported").length, 0);
    assert.equal(act(s, { type: "apply" }).lastAction, "human_review_required");
  }
  assert.equal(
    rule(
      act(initialState(), {
        type: "edit",
        title: "non gratuit",
        description: "test",
      }),
      "lexical_hint",
    ).length,
    1,
  );
});
test("Empty fields/template leftovers block approval and reasons are required", () => {
  let s = initialState();
  assert.throws(() => act(s, { type: "approve" }), /reason_required/);
  s = act(s, { type: "edit", title: "", description: "{{description}}" });
  assert.ok(controls(s).filter((x) => x.status === "block").length >= 2);
  assert.throws(
    () => act(s, { type: "approve", reason: "Checked" }),
    /deterministic_block/,
  );
});
test("Lock preserves existing value; explicit unlocking does not approve proposal", () => {
  const s = initialState("locked"),
    serialized = canonical(s);
  let out = act(s, { type: "apply" });
  assert.equal(out.lastAction, "locked_preserved");
  assert.deepEqual(out.current, s.current);
  assert.equal(canonical(s), serialized);
  assert.throws(() => act(out, { type: "unlock" }), /reason_required/);
  out = act(out, { type: "unlock", reason: "Inspect a new alternative" });
  assert.equal(out.lock, false);
  assert.equal(out.history.at(-1).action, "unlocked");
  assert.equal(act(out, { type: "apply" }).lastAction, "human_review_required");
});
test("Explicit simulation approval is bound to exact proposal, evidence and rules", () => {
  const start = act(act(initialState(), { type: "preset", id: "corrected" }), {
    type: "approve",
    reason: "Known neutral version examined",
  });
  assert.ok(approvalCurrent(start));
  for (const event of [
    {
      type: "edit",
      title: start.proposal.title + " !",
      description: start.proposal.description,
    },
    {
      type: "edit",
      title: start.proposal.title,
      description: start.proposal.description + " !",
    },
    { type: "source", id: "free" },
    { type: "rules", version: "2.0.0" },
  ]) {
    const changed = act(start, event);
    assert.equal(approvalCurrent(changed), false);
    assert.equal(changed.decision.kind, "review_required");
    assert.equal(
      act(changed, { type: "apply" }).lastAction,
      "human_review_required",
    );
  }
});
test("Material and cosmetic changes both invalidate approval, only material contradicts", () => {
  const s = initialState("changed");
  assert.ok(approvalCurrent(s));
  const material = act(s, { type: "source", id: "material" }),
    cosmetic = act(s, { type: "source", id: "cosmetic" });
  for (const x of [material, cosmetic]) {
    assert.equal(approvalCurrent(x), false);
    assert.equal(rule(x, "version_changed").length, 1);
  }
  assert.equal(rule(material, "claim_contradicted").length, 4);
  assert.equal(rule(cosmetic, "claim_contradicted").length, 0);
  assert.equal(rule(cosmetic, "claim_supported").length, 4);
});
test("Reject, request evidence and keep never delete or replace existing metadata", () => {
  for (const type of ["reject", "request", "keep"]) {
    const s = initialState(),
      out = act(s, { type, reason: "Not sufficiently documented" });
    assert.deepEqual(out.current, s.current);
    assert.equal(out.editorialVersion, 1);
    assert.equal(approvalCurrent(out), false);
  }
});
test("Unchanged replay is no_change and does not create editorial versions", () => {
  let s = initialState("unchanged");
  for (let i = 0; i < 4; i++) {
    s = act(s, { type: "apply" });
    assert.equal(s.lastAction, "no_change");
    assert.equal(s.editorialVersion, 1);
  }
  assert.equal(s.history.length, 4);
});
test("Changed approved value applies once; lock after apply and reset are reliable", () => {
  let s = act(initialState("locked"), {
    type: "unlock",
    reason: "Try documented alternate",
  });
  s = act(s, {
    type: "approve",
    reason: "Examined this fictional combination",
  });
  s = act(s, { type: "apply" });
  assert.equal(s.editorialVersion, 2);
  assert.deepEqual(s.current, s.proposal);
  s = act(s, { type: "lock" });
  assert.ok(s.lock);
  assert.deepEqual(act(s, { type: "reset" }), initialState("locked"));
});
test("JSON export retains exact state and truthful provenance; no invented model or reviewer", async () => {
  const s = act(initialState(), {
      type: "request",
      reason: "Confirm price and timing",
    }),
    out = await exportSession(s, { kit: "1.0.2" }, at);
  assert.equal(out.kind, "educational_simulation");
  assert.equal(out.isPublication, false);
  assert.deepEqual(out.state, s);
  assert.deepEqual(out.history, s.history);
  assert.deepEqual(out.controls, controls(s));
  assert.equal(out.fingerprints.combination, await digest(binding(s)));
  assert.equal(out.exportedAt, at);
  assert.equal(out.provider, undefined);
  assert.equal(out.reviewer, undefined);
  assert.notEqual(out.schema, "parent-contract");
});
test("CSV schema matches review template, unknown provenance stays empty, formulas escaped", async () => {
  const d = await verify();
  for (const value of [
    '=HYPERLINK("https://example.com")',
    " +SUM(1,2)",
    "\t@SUM(1,2)",
    "-10",
  ]) {
    const s = act(initialState(), {
        type: "edit",
        title: value,
        description: "=1+1",
      }),
      row = parseCSV(reviewCSV(s, d.reviewColumns))[0];
    assert.equal(row.proposed_title, "'" + value);
    assert.equal(row.proposed_description, "'=1+1");
    assert.equal(row.source_hash, "");
    assert.equal(row.provider, "");
    assert.equal(row.generated_at, "");
    assert.equal(row.reviewer_role, "");
    assert.equal((await exportSession(s, {})).proposal.title, value);
  }
});
test("Shared links restore public variants only, never free text, reasons or approval", () => {
  let s = act(initialState(), { type: "source", id: "free" });
  s = act(s, { type: "preset", id: "free" });
  s = act(s, { type: "approve", reason: "PERSONAL REASON" });
  const url = presetLink(
    "https://edikkaweb.github.io/metadata-review-demo/",
    s,
  );
  assert.equal(url.includes("PERSONAL"), false);
  const restored = stateFromHash(new URL(url).hash);
  assert.deepEqual(restored.proposal, s.proposal);
  assert.equal(restored.source, "free");
  assert.equal(restored.decision.kind, "pending_review");
  s = act(s, {
    type: "edit",
    title: "PRIVATE TEXT",
    description: s.proposal.description,
  });
  assert.throws(() => presetLink("https://example.com/", s), /share_free_text/);
  for (const hash of [
    "#case=promise&v=9",
    "#case=unknown&v=1.0.0",
    "#case=promise&case=locked&v=1.0.0",
    "#case=promise&v=1.0.0&private=x",
  ])
    assert.throws(() => stateFromHash(hash));
});
test("Every predefined initial outcome matches published expectations FR/EN", () => {
  for (const lang of ["fr", "en"])
    for (const d of scenarios(lang)) {
      const s = initialState(d.id, lang);
      for (const ruleName of d.expected.controls)
        assert.ok(rule(s, ruleName).length, d.id + ":" + ruleName);
      assert.equal(
        act(s, { type: "apply" }).lastAction,
        d.expected.action,
        d.id,
      );
    }
});
test("HTML static fallback, escaped user data and original corpus values remain available", async () => {
  const d = await verify();
  for (const lang of ["fr", "en"]) {
    let s = act(initialState("promise", lang), {
      type: "edit",
      title: "<img src=x onerror=alert(1)>",
      description: "</textarea><script>alert(1)</script>",
    });
    const html = frameHTML(s, d, lang);
    assert.ok(html.includes("&lt;img"));
    assert.ok(!html.includes("<script>alert"));
    assert.equal((html.match(/class="corpus-record"/g) || []).length, 6);
    assert.ok(html.includes("source_hash"));
    assert.ok(html.includes("script") && html.includes("JavaScript"));
    assert.ok(html.includes("pending_review"));
    assert.ok(
      html.includes("developers.google.com/search/docs/appearance/title-link"),
    );
  }
});
