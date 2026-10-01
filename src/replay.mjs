import { readFile } from "node:fs/promises";
import {
  initialState,
  transition,
  exportSession,
  controls,
  binding,
  definition,
} from "./engine.mjs";
import { canonical, VERSIONS } from "./core.mjs";
import { verify } from "./verify.mjs";
const [arg = "promise", ...flags] = process.argv.slice(2),
  data = await verify();
let state;
if (arg.endsWith(".json")) {
  const input = JSON.parse(await readFile(arg, "utf8"));
  if (
    input.schema !== VERSIONS.session ||
    input.kind !== "educational_simulation" ||
    !input.state
  )
    throw Error("Unsupported simulation export");
  state = input.state;
  const d = definition(state);
  if (
    !d.sources[state.source] ||
    state.rules !== VERSIONS.rules ||
    typeof state.proposal.title !== "string" ||
    typeof state.proposal.description !== "string"
  )
    throw Error("Invalid state");
  const recalculated = await exportSession(
    state,
    data.provenance,
    input.exportedAt,
  );
  for (const key of [
    "controls",
    "fingerprints",
    "proposal",
    "retainedValue",
    "approvalCurrent",
  ])
    if (canonical(input[key]) !== canonical(recalculated[key]))
      throw Error(`Replay mismatch: ${key}`);
  console.log(
    JSON.stringify(
      {
        status: "reproduced",
        scenario: state.scenario,
        controls: controls(state),
        approvalCurrent: recalculated.approvalCurrent,
        fingerprints: recalculated.fingerprints,
        note: "Local simulation record, not authentication of a human review or parent-contract validation.",
      },
      null,
      2,
    ),
  );
} else {
  const opts = Object.fromEntries(
    flags.map((x) => x.replace(/^--/, "").split("=")),
  );
  state = initialState(arg, opts.lang || "fr");
  if (opts.source)
    state = transition(state, { type: "source", id: opts.source });
  if (opts.proposal)
    state = transition(state, { type: "preset", id: opts.proposal });
  if (opts.apply === "true") state = transition(state, { type: "apply" });
  console.log(
    JSON.stringify(await exportSession(state, data.provenance), null, 2),
  );
}
