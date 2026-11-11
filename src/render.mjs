// Renders the README stack to high-res PNG previews, framed like GitHub
// in light and dark mode (render/preview-light.png, render/preview-dark.png).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const names = ["hero", "services", "projects", "footer"];
const W = 1000, PAD = 32, GAP = 8, SCALE = 2;
const heights = names.map((n) => +readFileSync(join(ROOT, "assets", n + ".svg"), "utf8").match(/viewBox="0 0 \d+ (\d+)"/)[1]);
const H = heights.reduce((a, b) => a + b, 0) + GAP * (names.length - 1) + PAD * 2;
mkdirSync(join(ROOT, "render"), { recursive: true });
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";

// static copies with the entrance animations switched off, so the shot shows the final frame
mkdirSync(join(ROOT, "render", "static"), { recursive: true });
for (const n of names) {
  const svg = readFileSync(join(ROOT, "assets", n + ".svg"), "utf8").replace("<style>", "<style>*{animation:none!important}");
  writeFileSync(join(ROOT, "render", "static", n + ".svg"), svg);
}

for (const [mode, bg] of [["light", "#ffffff"], ["dark", "#0d1117"]]) {
  const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:${bg}}
.s{padding:${PAD}px;display:flex;flex-direction:column;gap:${GAP}px}img{display:block;width:${W}px}</style>
<div class="s">${names.map((n) => `<img src="static/${n}.svg">`).join("")}</div>`;
  const page = join(ROOT, "render", `page-${mode}.html`);
  writeFileSync(page, html);
  const out = join(ROOT, "render", `preview-${mode}.png`);
  execFileSync(chrome, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
    `--window-size=${W + PAD * 2},${H}`, `--force-device-scale-factor=${SCALE}`,
    "--virtual-time-budget=10000", `--screenshot=${out}`, pathToFileURL(page).href,
  ], { stdio: "ignore" });
  console.log("saved", out, `${(W + PAD * 2) * SCALE}x${H * SCALE}`);
}
