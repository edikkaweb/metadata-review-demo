import {
  VERSIONS,
  clone,
  canonical,
  similarity,
  digest,
  csvCell,
  textLength,
} from "./core.mjs";
import { scenarios, SCENARIO_VERSION } from "./scenarios.mjs";
export function definition(s) {
  const d = scenarios(s.locale).find((x) => x.id === s.scenario);
  if (!d) throw Error("Unknown scenario");
  return d;
}
export const evidence = (s) => definition(s).sources[s.source];
export const binding = (s) =>
  canonical({
    scenario: s.scenario,
    scenarioVersion: SCENARIO_VERSION,
    locale: s.locale,
    evidence: evidence(s),
    proposal: s.proposal,
    rules: s.rules,
  });
export const approvalCurrent = (s) =>
  s.decision.kind === "approved" && s.decision.binding === binding(s);
const values = (p) => ({ title: p.title, description: p.description });
export function initialState(id = "promise", locale = "fr") {
  if (!["fr", "en"].includes(locale)) throw Error("Unknown content language");
  const d = scenarios(locale).find((x) => x.id === id);
  if (!d) throw Error("Unknown scenario");
  const s = {
    schema: VERSIONS.session,
    scenario: id,
    scenarioVersion: d.version,
    locale,
    rules: VERSIONS.rules,
    source: d.defaultSource,
    proposal: values(d.proposals.initial),
    current: clone(d.existing),
    editorialVersion: 1,
    proposalVersion: 1,
    lock: d.locked,
    decision: {
      kind: "pending_review",
      actor: null,
      reason: "",
      binding: null,
    },
    lastAction: "idle",
    history: [],
    sequence: 0,
  };
  if (d.initialApproval)
    s.decision = {
      kind: "approved",
      actor: "documented_fixture",
      reason: "Predefined fictional decision; no real reviewer.",
      binding: binding(s),
    };
  if (d.protectedFixture)
    s.protectedFixture = {
      kind: "fictional_previous_approval",
      value: clone(d.existing),
      evidence: clone(evidence(s)),
      reviewer: null,
      reviewedAt: null,
    };
  return s;
}
export function controls(s) {
  const d = definition(s),
    e = evidence(s),
    out = [];
  const add = (rule, category, status, field, detail = {}) =>
    out.push({ rule, category, status, field, ...detail });
  for (const field of ["title", "description"]) {
    const value = s.proposal[field];
    add(
      "field_present",
      "deterministic",
      value.trim() ? "pass" : "block",
      field,
      { length: textLength(value), evidence: "proposal." + field },
    );
    const variables =
      value.match(/\{\{[^}]*\}\}|\[\[[^\]]*\]\]|%[A-Z_]+%|\$\{[^}]*\}/g) || [];
    add(
      "template_variables",
      "deterministic",
      variables.length ? "block" : "pass",
      field,
      { terms: variables, evidence: "proposal." + field },
    );
    const known = Object.values(d.proposals).find((p) => p[field] === value);
    if (known) {
      for (const claim of known.claims[field] || []) {
        const fact = e.facts[claim.fact];
        add(
          fact == null
            ? "claim_unverified"
            : fact === claim.value
              ? "claim_supported"
              : "claim_contradicted",
          "human",
          fact == null
            ? "review"
            : fact === claim.value
              ? "supported"
              : "review",
          field,
          {
            term: claim.term,
            expected: claim.value,
            observed: fact,
            fact: claim.fact,
            evidence: `scenario.${d.id}.sources.${s.source}.facts.${claim.fact}`,
            bounded: true,
          },
        );
      }
    } else {
      const hints =
        value.match(
          /\b(?:gratuite?s?|gratuitement|free|\d+\s*(?:h|heures?|hours?|jours?|days?))\b/giu,
        ) || [];
      if (hints.length)
        add("lexical_hint", "heuristic", "review", field, {
          terms: hints,
          evidence: "proposal." + field,
        });
      add("free_text_not_evaluated", "human", "not_evaluated", field, {
        evidence: "proposal." + field,
      });
    }
  }
  for (const other of e.otherPages || []) {
    const score = similarity(s.proposal.title, other.title);
    if (s.proposal.title && s.proposal.title === other.title)
      add("exact_title_duplicate", "deterministic", "review", "title", {
        other: other.url,
        score,
        evidence: "source.otherPages",
      });
    else if (score >= 0.72)
      add("title_similarity", "heuristic", "review", "title", {
        other: other.url,
        score,
        threshold: 0.72,
        evidence: "source.otherPages",
      });
  }
  if (s.lock)
    add("manual_lock", "deterministic", "protected", "both", {
      evidence: "session.lock",
    });
  if (s.decision.binding && s.decision.binding !== binding(s))
    add("version_changed", "deterministic", "review", "both", {
      evidence: "decision.binding vs current combination",
    });
  add(
    "editorial_review",
    "human",
    approvalCurrent(s) ? "simulated_approval" : "review",
    "both",
    { evidence: "visitor decision; never an automatic approval" },
  );
  return out;
}
function record(s, type, details, now) {
  s.sequence++;
  s.history.push({
    sequence: s.sequence,
    action: type,
    at: now,
    actor: "visitor_simulation",
    ...details,
  });
  s.lastAction = type;
}
function invalidate(s) {
  if (s.decision.kind === "approved")
    s.decision = {
      ...s.decision,
      kind: "review_required",
      previousKind: "approved",
    };
  else if (s.decision.kind !== "pending_review")
    s.decision = { ...s.decision, kind: "review_required" };
}
export function transition(state, event, now = new Date().toISOString()) {
  const s = clone(state),
    d = definition(s),
    before = binding(s);
  if (!event || typeof event.type !== "string") throw Error("Invalid action");
  const reason = String(event.reason || "").trim();
  if (reason.length > 800) throw Error("reason_length");
  const needReason = () => {
    if (!reason) throw Error("reason_required");
  };
  switch (event.type) {
    case "edit": {
      for (const f of ["title", "description"]) {
        if (typeof event[f] !== "string" || event[f].length > 2000)
          throw Error("text_length");
      }
      if (canonical(s.proposal) === canonical(values(event))) return s;
      s.proposal = values(event);
      s.proposalVersion++;
      invalidate(s);
      record(s, "proposal_changed", { proposal: clone(s.proposal) }, now);
      break;
    }
    case "preset": {
      const p = d.proposals[event.id];
      if (!p) throw Error("Unknown proposal preset");
      return transition(s, { type: "edit", ...values(p) }, now);
    }
    case "source": {
      if (!d.sources[event.id]) throw Error("Unknown evidence variant");
      if (s.source === event.id) return s;
      s.source = event.id;
      invalidate(s);
      record(s, "evidence_changed", { source: event.id }, now);
      break;
    }
    case "rules": {
      if (typeof event.version !== "string" || !event.version)
        throw Error("Invalid rules version");
      if (event.version === s.rules) return s;
      s.rules = event.version;
      invalidate(s);
      record(s, "rules_changed", { rules: s.rules }, now);
      break;
    }
    case "approve": {
      needReason();
      if (controls(s).some((x) => x.status === "block"))
        throw Error("deterministic_block");
      if (s.rules !== VERSIONS.rules) throw Error("rules_unavailable");
      s.decision = {
        kind: "approved",
        actor: "visitor_simulation",
        reason,
        binding: binding(s),
      };
      record(
        s,
        "approved_in_simulation",
        { reason, binding: s.decision.binding },
        now,
      );
      break;
    }
    case "keep": {
      s.decision = {
        kind: "kept_existing",
        actor: "visitor_simulation",
        reason,
        binding: binding(s),
      };
      record(s, "existing_preserved", { reason }, now);
      break;
    }
    case "reject": {
      needReason();
      s.decision = {
        kind: "rejected",
        actor: "visitor_simulation",
        reason,
        binding: binding(s),
      };
      record(s, "proposal_rejected_existing_preserved", { reason }, now);
      break;
    }
    case "request": {
      needReason();
      s.decision = {
        kind: "evidence_requested",
        actor: "visitor_simulation",
        reason,
        binding: binding(s),
      };
      record(s, "evidence_requested_existing_preserved", { reason }, now);
      break;
    }
    case "unlock": {
      needReason();
      if (!s.lock) return s;
      s.lock = false;
      record(s, "unlocked", { reason }, now);
      break;
    }
    case "lock": {
      if (!approvalCurrent(s) || canonical(s.proposal) !== canonical(s.current))
        throw Error("apply_before_lock");
      s.lock = true;
      record(s, "locked", {}, now);
      break;
    }
    case "apply": {
      if (s.lock) {
        record(s, "locked_preserved", {}, now);
        break;
      }
      if (
        !approvalCurrent(s) ||
        s.rules !== VERSIONS.rules ||
        controls(s).some((x) => x.status === "block")
      ) {
        record(s, "human_review_required", {}, now);
        break;
      }
      if (canonical(s.current) === canonical(s.proposal)) {
        record(s, "no_change", {}, now);
        break;
      }
      const previous = clone(s.current);
      s.current = clone(s.proposal);
      s.editorialVersion++;
      record(
        s,
        "applied_in_simulation",
        {
          previous,
          value: clone(s.current),
          editorialVersion: s.editorialVersion,
        },
        now,
      );
      break;
    }
    case "reset":
      return initialState(s.scenario, s.locale);
    default:
      throw Error("Unknown action");
  }
  if (before !== binding(s) && s.decision.kind === "approved")
    throw Error("Approval binding invariant");
  return s;
}
export const fingerprintMethods = {
  historicalSourceHash:
    'SHA-256 UTF-8 of [title, description, h1, canonical].join("\\n"). Not full HTML.',
  scenarioEvidenceHash:
    "SHA-256 UTF-8 of canonical JSON (recursive sorted object keys, array order preserved) of {scenario, scenarioVersion, locale, evidence}. evidence contains id, text, facts, unknown and any condition/otherPages.",
  proposalHash: "SHA-256 canonical JSON of {title,description}.",
  approvalBinding:
    "SHA-256 canonical JSON of {scenario, scenarioVersion, locale, evidence, proposal, rules}.",
};
export async function exportSession(
  s,
  provenance,
  now = new Date().toISOString(),
) {
  const d = definition(s),
    proof = {
      scenario: s.scenario,
      scenarioVersion: s.scenarioVersion,
      locale: s.locale,
      evidence: evidence(s),
    };
  return {
    schema: VERSIONS.session,
    kind: "educational_simulation",
    isPublication: false,
    versions: clone(VERSIONS),
    scenario: {
      id: s.scenario,
      version: s.scenarioVersion,
      locale: s.locale,
      company: d.company,
      fictional: true,
    },
    kitProvenance: clone(provenance),
    initialValues: clone(d.existing),
    evidence: clone(evidence(s)),
    proposal: clone(s.proposal),
    retainedValue: clone(s.current),
    controls: controls(s),
    decision: clone(s.decision),
    approvalCurrent: approvalCurrent(s),
    lock: s.lock,
    lastAction: s.lastAction,
    editorialVersion: s.editorialVersion,
    proposalVersion: s.proposalVersion,
    fingerprints: {
      method: fingerprintMethods,
      evidence: await digest(proof),
      proposal: await digest(s.proposal),
      combination: await digest(binding(s)),
    },
    history: clone(s.history),
    state: clone(s),
    exportedAt: now,
    limitations: [
      "Simulation only; no named real reviewer or model.",
      "This session schema is distinct from the parent recommendation contract.",
      "Free text is not fact-checked. Corpus observations remain pending_review.",
    ],
  };
}
export function reviewCSV(s, columns) {
  const d = definition(s);
  const row = {
    url: d.url,
    locale: s.locale,
    page_type: "service",
    target_intent: "educational simulation",
    contract_version: VERSIONS.session,
    ruleset_version: s.rules,
    existing_title: d.existing.title,
    existing_description: d.existing.description,
    proposed_title: s.proposal.title,
    proposed_description: s.proposal.description,
    evidence: canonical(evidence(s)),
    machine_flags: controls(s)
      .filter((x) => !["pass", "supported"].includes(x.status))
      .map((x) => x.rule + ":" + x.field)
      .join(" | "),
    reason_code: s.decision.reason,
    human_decision: "simulation:" + s.decision.kind,
    manual_lock: String(s.lock),
    stale: String(
      Boolean(s.decision.binding && s.decision.binding !== binding(s)),
    ),
    batch_id: "fictional:" + s.scenario + ":" + s.scenarioVersion,
  };
  return (
    columns.map(csvCell).join(",") +
    "\r\n" +
    columns.map((k) => csvCell(row[k] ?? "")).join(",") +
    "\r\n"
  );
}
export function presetLink(base, s) {
  const d = definition(s),
    p = Object.entries(d.proposals).find(
      ([, v]) => canonical(values(v)) === canonical(s.proposal),
    );
  if (!p) throw Error("share_free_text");
  const url = new URL(base);
  url.hash = new URLSearchParams({
    case: s.scenario,
    evidence: s.source,
    proposal: p[0],
    v: SCENARIO_VERSION,
    content: s.locale,
  }).toString();
  return url.href;
}
export function stateFromHash(hash, locale = "fr") {
  if (!hash || ["#scenarios", "#corpus", "#method"].includes(hash))
    return initialState("promise", locale);
  const q = new URLSearchParams(hash.replace(/^#/, "")),
    allowed = ["case", "evidence", "proposal", "v", "content"];
  if (
    hash.length > 600 ||
    [...q.keys()].some((k) => !allowed.includes(k)) ||
    [...new Set(q.keys())].some((k) => q.getAll(k).length !== 1) ||
    q.get("v") !== SCENARIO_VERSION
  )
    throw Error("invalid_link");
  let s = initialState(q.get("case"), q.get("content") || locale);
  const d = definition(s);
  if (!d.sources[q.get("evidence")] || !d.proposals[q.get("proposal")])
    throw Error("invalid_link");
  s.source = q.get("evidence");
  s.proposal = values(d.proposals[q.get("proposal")]);
  if (s.decision.binding && s.decision.binding !== binding(s))
    s.decision = {
      kind: "pending_review",
      actor: null,
      reason: "",
      binding: null,
    };
  return s;
}
