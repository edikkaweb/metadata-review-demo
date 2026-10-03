import { mkdir, writeFile, cp, readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { verify } from "./verify.mjs";
import { initialState } from "./engine.mjs";
import { frameHTML } from "./render.mjs";
import { scenarios } from "./scenarios.mjs";
const data = await verify(),
  root = new URL("../", import.meta.url),
  dist = new URL("dist/", root);
await mkdir(dist, { recursive: true });
await mkdir(new URL("assets/", dist), { recursive: true });
await mkdir(new URL("data/", dist), { recursive: true });
await cp(new URL("originals/", root), new URL("originals/", dist), {
  recursive: true,
});
await cp(
  new URL("data/provenance.json", root),
  new URL("data/provenance.json", dist),
);
await writeFile(
  new URL("data/corpus.json", dist),
  JSON.stringify(data, null, 2) + "\n",
);
const sc = { fr: scenarios("fr"), en: scenarios("en") };
await writeFile(
  new URL("data/scenarios.json", root),
  JSON.stringify(sc, null, 2) + "\n",
);
await cp(
  new URL("data/scenarios.json", root),
  new URL("data/scenarios.json", dist),
);
for (const file of [
  "app.mjs",
  "core.mjs",
  "engine.mjs",
  "scenarios.mjs",
  "render.mjs",
  "style.css",
])
  await cp(new URL("src/" + file, root), new URL("assets/" + file, dist));
for (const lang of ["fr", "en"]) {
  const en = lang === "en",
    filename = en ? "index-en.html" : "index.html",
    title = en ? "Can we publish this title?" : "Peut-on publier ce titre ?",
    description = en
      ? "Examine the sources, checks and editorial decision. Five fictional scenarios and six archived Edikka metadata observations."
      : "Examinez les sources, les contrôles et la décision éditoriale. Cinq scénarios fictifs et six observations archivées Edikka.";
  const html = `<!doctype html>\n<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Edikka</title><meta name="description" content="${description}"><meta name="theme-color" content="#f7f7f5"><link rel="canonical" href="https://edikkaweb.github.io/metadata-review-demo/${en ? filename : ""}"><link rel="alternate" hreflang="fr" href="https://edikkaweb.github.io/metadata-review-demo/"><link rel="alternate" hreflang="en" href="https://edikkaweb.github.io/metadata-review-demo/index-en.html"><link rel="alternate" hreflang="x-default" href="https://edikkaweb.github.io/metadata-review-demo/"><link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20270%22%3E%3Crect%20width%3D%22400%22%20height%3D%22270%22%20rx%3D%2228%22%20fill%3D%22%230c1a24%22%2F%3E%3Cpath%20transform%3D%22translate%2818%2019%29%22%20fill%3D%22%23d8e58a%22%20d%3D%22M168%20100.38v16H17v99h202l-16%2016H0v-131ZM187.01.38h62.78a115.5%20115.5%200%200%201%200%20231H224l16-16h9.79a99.5%2099.5%200%200%200%200-199h-62.78ZM0%20.38h168v16H0Z%22%2F%3E%3C%2Fsvg%3E"><link rel="stylesheet" href="assets/style.css"><script type="module" src="assets/app.mjs"></script><meta property="og:type" content="website"><meta property="og:title" content="${title} — Edikka"><meta property="og:description" content="${description}"><meta property="og:url" content="https://edikkaweb.github.io/metadata-review-demo/${en ? filename : ""}"><meta property="og:image" content="https://edikkaweb.github.io/assets/metadata-review-demo.jpg"><meta name="twitter:card" content="summary_large_image"></head><body>${frameHTML(initialState("promise", lang), data, lang)}</body></html>\n`;
  await writeFile(new URL(filename, dist), html);
}
const entries = [];
async function walk(url, prefix = "") {
  for (const e of await readdir(url, { withFileTypes: true })) {
    if (e.isDirectory())
      await walk(new URL(e.name + "/", url), prefix + e.name + "/");
    else if (e.name !== "build-manifest.json") {
      const b = await readFile(new URL(e.name, url));
      entries.push({
        path: prefix + e.name,
        bytes: b.length,
        sha256: createHash("sha256").update(b).digest("hex"),
      });
    }
  }
}
await walk(dist);
entries.sort((a, b) => a.path.localeCompare(b.path));
await writeFile(
  new URL("build-manifest.json", dist),
  JSON.stringify({ version: "1.0.0", files: entries }, null, 2) + "\n",
);
console.log(
  `Built FR/EN static site: ${entries.length} files; originals verified.`,
);
