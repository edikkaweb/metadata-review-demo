import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseCSV, metadataFieldsHash } from "./core.mjs";
const root = new URL("../", import.meta.url),
  read = (p) => readFile(new URL(p, root));
const sha = (b) => createHash("sha256").update(b).digest("hex");
export async function verify() {
  const mBytes = await read("originals/manifest.json"),
    m = JSON.parse(mBytes),
    p = JSON.parse(await read("data/provenance.json"));
  if (
    sha(mBytes) !== p.manifestSha256 ||
    m.version !== "1.0.2" ||
    m.published !== "2026-09-22"
  )
    throw Error("Manifest drift");
  for (const f of m.files) {
    const b = await read("originals/" + f.path);
    if (b.length !== f.bytes || sha(b) !== f.sha256)
      throw Error("Integrity " + f.path);
  }
  const parent = await read("originals/parent-contract.schema.json");
  if (sha(parent) !== p.contract.sha256 || parent.length !== p.contract.bytes)
    throw Error("Parent integrity");
  const rows = parseCSV(
    (await read("originals/corpus-edikka-2026-09-22.csv")).toString(),
  );
  const definitions = JSON.parse(await read("originals/pages.json"));
  if (rows.length !== 6 || definitions.length !== 6) throw Error("Corpus size");
  for (const r of rows) {
    if (
      r.human_decision !== "pending_review" ||
      (await metadataFieldsHash(r)) !== r.source_hash ||
      !definitions.some((d) => d.url === r.url && d.locale === r.locale)
    )
      throw Error("Corpus invariant");
  }
  return {
    manifest: m,
    provenance: p,
    rows,
    reviewColumns: (await read("originals/review-template.csv"))
      .toString()
      .trim()
      .split(","),
  };
}
if (import.meta.url === new URL("file://" + process.argv[1]).href) {
  const d = await verify();
  console.log(
    `8 original files + parent contract intact; ${d.rows.length} rows pending_review; all four-field fingerprints exact.`,
  );
}
