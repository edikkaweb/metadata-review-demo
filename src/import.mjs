import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url),
  base = "https://www.edikka.com/docbd/data/metadata-review-kit-v1/";
const hash = (b) => createHash("sha256").update(b).digest("hex");
async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw Error(`${r.status} ${url}`);
  return Buffer.from(await r.arrayBuffer());
}
async function preserve(path, b) {
  let old;
  try {
    old = await readFile(new URL(path, root));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  if (old && !old.equals(b)) throw Error(`Refusing to replace ${path}`);
  await writeFile(new URL(path, root), b);
}
await mkdir(new URL("originals/", root), { recursive: true });
await mkdir(new URL("data/", root), { recursive: true });
const manifestBytes = await get(base + "manifest.json"),
  manifest = JSON.parse(manifestBytes);
if (manifest.version !== "1.0.2" || manifest.published !== "2026-09-22")
  throw Error("Review required: unexpected kit version/date");
const receipts = [];
for (const file of manifest.files) {
  if (!/^[a-zA-Z0-9._-]+$/.test(file.path)) throw Error("Unsafe manifest path");
  const bytes = await get(base + file.path);
  if (bytes.length !== file.bytes || hash(bytes) !== file.sha256)
    throw Error(`Integrity ${file.path}`);
  await preserve("originals/" + file.path, bytes);
  receipts.push({ ...file, url: base + file.path });
}
await preserve("originals/manifest.json", manifestBytes);
const contractUrl =
    "https://www.edikka.com/docbd/data/automatisation-seo-ia-recommandations.schema.json",
  contract = await get(contractUrl);
await preserve("originals/parent-contract.schema.json", contract);
const provenance = {
  importedAt: new Date().toISOString(),
  kit: manifest.version,
  observedAt: manifest.published,
  base,
  manifestSha256: hash(manifestBytes),
  contract: {
    url: contractUrl,
    sha256: hash(contract),
    bytes: contract.length,
  },
  files: receipts,
};
try {
  await readFile(new URL("data/provenance.json", root));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
  await writeFile(
    new URL("data/provenance.json", root),
    JSON.stringify(provenance, null, 2) + "\n",
  );
}
console.log(
  `Verified ${receipts.length} public originals and parent contract; historical values preserved.`,
);
