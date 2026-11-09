// Renders the whole README stack to one high-res PNG (render/profile-hq.png).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const names = ["hero", "services", "tools", "footer"];
const W = 1000, PAD = 24, GAP = 8, SCALE = 2;
const heights = names.map((n) => +readFileSync(join(ROOT, "assets", n + ".svg"), "utf8").match(/viewBox="0 0 \d+ (\d+)"/)[1]);
const H = heights.reduce((a, b) => a + b, 0) + GAP * (names.length - 1) + PAD * 2;
mkdirSync(join(ROOT, "render"), { recursive: true });
const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#0d1117}
.s{padding:${PAD}px;display:flex;flex-direction:column;gap:${GAP}px}img{display:block;width:${W}px}</style>
<div class="s">${names.map((n) => `<img src="../assets/${n}.svg">`).join("")}</div>`;
const page = join(ROOT, "render", "page.html");
writeFileSync(page, html);
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const out = join(ROOT, "render", "profile-hq.png");
execFileSync(chrome, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
  `--window-size=${W + PAD * 2},${H}`, `--force-device-scale-factor=${SCALE}`,
  "--virtual-time-budget=8000", `--screenshot=${out}`, pathToFileURL(page).href,
], { stdio: "inherit" });
console.log("saved", out, `${(W + PAD * 2) * SCALE}x${H * SCALE}`);
