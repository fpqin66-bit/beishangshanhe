import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
const root = path.resolve("dist");
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const assets = {};
const used = new Set(
  ["exhibits", "patterns", "stories", "wenchuang"].flatMap((n) =>
    [
      ...fs
        .readFileSync("src/data/" + n + ".json", "utf8")
        .matchAll(/\"([^\"]+\.webp)\"/g),
    ].map((m) => m[1]),
  ),
);
for (const file of fs.readdirSync(path.join(root, "assets"), {
  recursive: true,
})) {
  const normalized = file.split(path.sep).join("/");
  if (used.has(normalized))
    assets[normalized] =
      "data:image/webp;base64," +
      fs.readFileSync(path.join(root, "assets", file)).toString("base64");
}
// Package the five-chapter 2D exhibition as a self-contained offline page.
const bundled = await build({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  minify: true,
  write: false,
  outdir: "standalone",
  define: { "process.env.NODE_ENV": '"production"' },
});
const code = bundled.outputFiles.find((f) => f.path.endsWith(".js")).text;
const css = bundled.outputFiles
  .filter((f) => f.path.endsWith(".css"))
  .map((f) => f.text)
  .join("\n");
html = html.replace(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g, "");
html = html.replace(
  /<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
  "",
);
html = html.replace("</head>", () => "<style>" + css + "</style></head>");
const safe = code.replace(/<\/script/gi, "<\\/script");
html = html.replace(
  "</body>",
  () =>
    "<script>window.__EXHIBITION_ASSETS__=" +
    JSON.stringify(assets) +
    ";</script><script>" +
    safe +
    "</script></body>",
);
fs.writeFileSync(path.join(root, "背上的山河-独立展览.html"), html);
console.log("独立HTML已生成：全部脚本、样式及图片已内嵌，可离线打开。");

fs.writeFileSync(path.join(root, "exhibition-preview.html"), html);
