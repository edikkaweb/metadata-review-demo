import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../dist/", import.meta.url)),
  port = 4186,
  prefix = "/metadata-review-demo/";
const types = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".csv": "text/csv; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};
http
  .createServer(async (req, res) => {
    const u = new URL(req.url, "http://127.0.0.1");
    if (!u.pathname.startsWith(prefix)) {
      res.writeHead(302, { Location: prefix });
      return res.end();
    }
    const name =
        decodeURIComponent(u.pathname.slice(prefix.length)) || "index.html",
      f = path.resolve(root, name);
    if (!f.startsWith(root)) {
      res.writeHead(403);
      return res.end();
    }
    try {
      const b = await readFile(f);
      res.writeHead(200, {
        "Content-Type": types[path.extname(f)] || "application/octet-stream",
        "Cache-Control": "no-store",
        ...(u.searchParams.has("nojs")
          ? { "Content-Security-Policy": "script-src 'none'" }
          : {}),
      });
      res.end(b);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`http://127.0.0.1:${port}${prefix}`),
  );
