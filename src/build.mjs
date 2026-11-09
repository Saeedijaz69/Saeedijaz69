// Builds the profile README graphics (assets/*.svg).
// Every piece of text is converted to vector outlines with the real
// Inter Display font, so it looks identical on every device.
//
//   npm run build
//
import opentype from "opentype.js";
import sharp from "sharp";
import * as SI from "simple-icons";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets");
mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------------------ */
/* Content — edit me                                                   */
/* ------------------------------------------------------------------ */
const ME = {
  first: "Saeed",
  last: "Ijaz",
  roles: "DESIGNER · VIDEOGRAPHER · VIDEO EDITOR",
  intro: [
    "I design, shoot and edit, and I build my own",
    "products along the way. Based in Dubai, working",
    "with the latest AI to go from idea to finished, fast.",
  ],
  status: "Available for work",
  services: [
    {
      icon: "pen",
      title: "Design",
      text: ["Brand, social and UI design that is clean,", "intentional and made to be used."],
      tags: "FIGMA · PHOTOSHOP · ILLUSTRATOR",
    },
    {
      icon: "camera",
      title: "Videography",
      text: ["Brand films, reels and product shoots", "with a cinematic eye for light."],
      tags: "BRAND FILMS · REELS · PRODUCT",
    },
    {
      icon: "timeline",
      title: "Video Editing",
      text: ["Cutting, colour and motion that keeps", "people watching until the last frame."],
      tags: "PREMIERE · AFTER EFFECTS · DAVINCI",
    },
    {
      icon: "spark",
      title: "Projects & AI",
      text: ["Building my own apps, plugins and tools", "with the newest AI models and workflows."],
      tags: "CLAUDE · CODEX",
    },
  ],
  footer: {
    text: ["Designer, videographer and video editor", "building with AI. Based in Dubai."],
    button: "Let's create something",
    info: [
      ["Based in", "Dubai, UAE"],
      ["Time zone", "GMT+4"],
      ["Open to", "Freelance & collabs"],
    ],
    left: `© ${new Date().getFullYear()} Saeed Ijaz`,
  },
};

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const W = 1000;
const C = {
  bg: "#000000",
  panel: "#0A0A0A",
  line: "#FFFFFF",
  text: "#FFFFFF",
  accent: "#FF4A2B",
  green: "#3DDC84",
};

const F = {
  bold: opentype.loadSync(join(ROOT, "src/fonts/InterDisplay-Bold.otf")),
  semi: opentype.loadSync(join(ROOT, "src/fonts/InterDisplay-SemiBold.otf")),
  med: opentype.loadSync(join(ROOT, "src/fonts/InterDisplay-Medium.otf")),
  reg: opentype.loadSync(join(ROOT, "src/fonts/InterDisplay-Regular.otf")),
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function layout(font, str, size, ls) {
  const glyphs = font.stringToGlyphs(str);
  const s = size / font.unitsPerEm;
  let x = 0;
  const items = [];
  glyphs.forEach((g, i) => {
    items.push({ g, x });
    x += g.advanceWidth * s;
    if (i < glyphs.length - 1) x += font.getKerningValue(g, glyphs[i + 1]) * s + ls;
  });
  return { items, width: x };
}
const measure = (str, size, w = "bold", ls = 0) => layout(F[w], str, size, ls).width;

/** Text as a single <path>. */
function T(str, { x, y, size, w = "bold", fill = C.text, op, ls = 0, anchor = "start", cls, style }) {
  const L = layout(F[w], str, size, ls);
  const x0 = anchor === "middle" ? x - L.width / 2 : anchor === "end" ? x - L.width : x;
  let d = "";
  for (const it of L.items) d += it.g.getPath(x0 + it.x, y, size).toPathData(2);
  return `<path d="${d}" fill="${fill}"${op != null ? ` fill-opacity="${op}"` : ""}${cls ? ` class="${cls}"` : ""}${style ? ` style="${style}"` : ""}/>`;
}
const label = (str, x, y, o = {}) => T(str, { x, y, size: 13, w: "bold", op: 0.55, ls: 1.4, ...o });

/** The orange "+" mark. */
const plus = (cx, cy, s = 22, t = 5, cls = "plus") =>
  `<g class="${cls}" style="transform-origin:${cx}px ${cy}px"><rect x="${cx - s / 2}" y="${cy - t / 2}" width="${s}" height="${t}" fill="${C.accent}"/><rect x="${cx - t / 2}" y="${cy - s / 2}" width="${t}" height="${s}" fill="${C.accent}"/></g>`;

const spark = (cx, cy, r, fill = C.text, op = 1) =>
  `<path d="M${cx},${cy - r}C${cx},${cy - r * 0.22} ${cx + r * 0.22},${cy} ${cx + r},${cy}C${cx + r * 0.22},${cy} ${cx},${cy + r * 0.22} ${cx},${cy + r}C${cx},${cy + r * 0.22} ${cx - r * 0.22},${cy} ${cx - r},${cy}C${cx - r * 0.22},${cy} ${cx},${cy - r * 0.22} ${cx},${cy - r}Z" fill="${fill}" fill-opacity="${op}"/>`;

/** A pill that looks like a button but is a status badge, not a link. */
function pill(x, y, text, { h = 46, primary = true, dot = null, icon = null, size = 15 } = {}) {
  const pad = 22;
  const lead = dot || icon ? 20 : 0;
  const w = measure(text, size, "med") + pad * 2 + lead;
  const r = h / 2;
  let s = `<g>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${primary ? "url(#btn)" : "none"}" stroke="${C.line}" stroke-opacity="${primary ? 0.16 : 0.1}"/>`;
  if (primary) s += `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h / 2}" rx="${r - 1}" fill="#fff" fill-opacity=".04"/>`;
  if (dot) s += `<circle cx="${x + pad + 4}" cy="${y + h / 2}" r="4.5" fill="${dot}" class="pulse"/><circle cx="${x + pad + 4}" cy="${y + h / 2}" r="4.5" fill="none" stroke="${dot}" class="ping" style="transform-origin:${x + pad + 4}px ${y + h / 2}px"/>`;
  if (icon === "spark") s += `<g class="twinkle" style="transform-origin:${x + pad + 5}px ${y + h / 2}px">${spark(x + pad + 5, y + h / 2, 7, C.accent)}</g>`;
  s += T(text, { x: x + pad + lead, y: y + h / 2 + size * 0.36, size, w: "med" });
  return { svg: s + `</g>`, w };
}

/** Faint vertical grid lines like the template. */
const grid = (h) =>
  `<g stroke="${C.line}" stroke-opacity=".055">${[200, 400, 600, 800].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="${h}"/>`).join("")}</g>`;

const BASE_CSS = `
  .up{opacity:0;animation:up 1s cubic-bezier(.16,.84,.3,1) forwards}
  @keyframes up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
  .fade{opacity:0;animation:fade 1.4s ease forwards}
  @keyframes fade{to{opacity:1}}
  .plus{animation:turn 7s cubic-bezier(.7,0,.3,1) infinite}
  @keyframes turn{0%,72%{transform:rotate(0)}86%,100%{transform:rotate(180deg)}}
  .pulse{animation:pulse 2.2s ease-in-out infinite}
  @keyframes pulse{50%{opacity:.45}}
  .ping{animation:ping 2.2s cubic-bezier(0,0,.2,1) infinite}
  @keyframes ping{0%{transform:scale(1);opacity:.8}80%,100%{transform:scale(2.6);opacity:0}}
  .twinkle{animation:tw 3.2s ease-in-out infinite}
  @keyframes tw{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(.7) rotate(45deg)}}
  .breathe{animation:br 9s ease-in-out infinite}
  @keyframes br{50%{opacity:.55}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important;opacity:1!important}}
`;

/** Wrap content in a rounded black card. */
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
function svg(name, h, body, { css = "", defs = "", gridLines = true, title: rawTitle = name } = {}) {
  const title = esc(rawTitle);
  const out = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="${title}">
<title>${title}</title>
<style>${BASE_CSS}${css}</style>
<defs>
  <clipPath id="card"><rect width="${W}" height="${h}" rx="28"/></clipPath>
  <linearGradient id="btn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A1A1A"/><stop offset="1" stop-color="#0B0B0B"/></linearGradient>
  ${defs}
</defs>
<g clip-path="url(#card)">
  <rect width="${W}" height="${h}" fill="${C.bg}"/>
  ${gridLines ? grid(h) : ""}
  ${body}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${h - 1}" rx="27.5" fill="none" stroke="${C.line}" stroke-opacity=".09"/>
</svg>
`;
  writeFileSync(join(OUT, `${name}.svg`), out);
  return out.length;
}

const glow = (id, color, op) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;

const sizes = {};

/* ------------------------------------------------------------------ */
/* 1. Hero                                                             */
/* ------------------------------------------------------------------ */
{
  const h = 640;
  let portrait = "";
  const src = join(ROOT, "_private/portrait.png");
  if (existsSync(src)) {
    const jpg = await sharp(src).resize({ width: 900 }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
    const meta = await sharp(jpg).metadata();
    // fit the portrait to the right side, top-aligned
    const pw = 580;
    const ph = (meta.height / meta.width) * pw;
    portrait = `<image class="photo" x="${W - pw + 40}" y="-50" width="${pw}" height="${ph}" href="data:image/jpeg;base64,${jpg.toString("base64")}"/>`;
  } else {
    portrait = `<ellipse cx="760" cy="300" rx="190" ry="240" fill="#141414"/>`;
  }
  const nameSize = 104;
  const full = `${ME.first} ${ME.last}`;
  const nameW = measure(full, nameSize, "bold", -2.6);
  let b = "";
  b += `<g class="breathe"><ellipse cx="260" cy="40" rx="420" ry="260" fill="url(#g1)"/><ellipse cx="640" cy="-20" rx="380" ry="220" fill="url(#g2)"/></g>`;
  // photo fades into the page on the left and bottom
  b += `<g mask="url(#mh)"><g mask="url(#mv)"><g class="fade" style="animation-duration:2.2s">${portrait}</g></g></g>`;
  b += label(ME.roles, 48, 352, { cls: "up", style: "animation-delay:.1s" });
  b += T(full, { x: 44, y: 448, size: nameSize, w: "bold", ls: -2.6, cls: "up", style: "animation-delay:.2s" });
  b += `<g class="up" style="animation-delay:.35s">${plus(44 + nameW + 18, 372, 30, 7)}</g>`;
  ME.intro.forEach((line, i) => {
    b += T(line, { x: 48, y: 496 + i * 26, size: 17.5, w: "med", op: 0.62, cls: "up", style: `animation-delay:${0.4 + i * 0.06}s` });
  });
  const p1 = pill(48, 566, "Open for projects");
  const p2 = pill(48 + p1.w + 12, 566, "Dubai, UAE", { primary: false });
  b += `<g class="up" style="animation-delay:.6s">${p1.svg}${p2.svg}</g>`;
  sizes.hero = svg("hero", h, b, {
    title: "Saeed Ijaz — designer, videographer and video editor in Dubai",
    defs: `${glow("g1", "#B3261E", 0.34)}${glow("g2", "#5B2A86", 0.28)}
      <linearGradient id="fl" gradientUnits="userSpaceOnUse" x1="440" y1="0" x2="640" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
      <linearGradient id="fb" gradientUnits="userSpaceOnUse" x1="0" y1="${h - 170}" x2="0" y2="${h - 10}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
      <mask id="mh" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${h}"><rect width="${W}" height="${h}" fill="url(#fl)"/></mask>
      <mask id="mv" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${h}"><rect width="${W}" height="${h}" fill="url(#fb)"/></mask>`,
    css: `.photo{animation:zoom 2.6s cubic-bezier(.16,.84,.3,1) forwards;transform-origin:760px 260px}@keyframes zoom{from{transform:scale(1.06)}to{transform:none}}`,
  });
}

/* ------------------------------------------------------------------ */
/* 2. Services                                                         */
/* ------------------------------------------------------------------ */
const ICONS = {
  pen: `<path d="M14 34 C18 18 30 18 34 34" fill="none" stroke="#fff" stroke-width="2"/><circle cx="14" cy="34" r="3" fill="#000" stroke="#fff" stroke-width="2"/><circle cx="34" cy="34" r="3" fill="#000" stroke="#fff" stroke-width="2"/><path d="M14 34 L10 18 M34 34 L38 18" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/><circle cx="10" cy="17" r="2" fill="#fff"/><circle cx="38" cy="17" r="2" fill="#fff"/>`,
  camera: `<rect x="9" y="16" width="22" height="17" rx="4" fill="none" stroke="#fff" stroke-width="2"/><path d="M31 22 L39 17 V32 L31 27Z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><circle cx="15" cy="22" r="2" fill="${C.accent}"/>`,
  timeline: `<rect x="9" y="14" width="18" height="5" rx="2.5" fill="#fff"/><rect x="15" y="22" width="24" height="5" rx="2.5" fill="#fff" fill-opacity=".55"/><rect x="9" y="30" width="13" height="5" rx="2.5" fill="#fff" fill-opacity=".8"/><path d="M29 10 V38" stroke="${C.accent}" stroke-width="2"/>`,
  spark: spark(24, 24, 13) + spark(36, 13, 4.5, C.accent),
};
{
  const top = 176, cw = 460, ch = 214, gx = 32, gy = 20;
  const h = top + ch * 2 + gy + 32;
  let b = `<ellipse cx="900" cy="40" rx="360" ry="200" fill="url(#g1)" class="breathe"/>`;
  b += plus(52, 40, 18, 4);
  b += label("WHAT I DO", 48, 82);
  b += T("Services", { x: 44, y: 146, size: 70, w: "bold", ls: -1.8 });
  ME.services.forEach((s, i) => {
    const x = gx + (i % 2) * (cw + 16);
    const y = top + Math.floor(i / 2) * (ch + gy);
    b += `<g class="up" style="animation-delay:${0.15 + i * 0.1}s"><g transform="translate(${x} ${y})">`;
    b += `<rect width="${cw}" height="${ch}" rx="20" fill="${C.panel}" stroke="#fff" stroke-opacity=".08"/>`;
    b += `<rect x="24" y="24" width="48" height="48" rx="12" fill="#111" stroke="#fff" stroke-opacity=".12"/>`;
    b += `<g transform="translate(24 24)">${ICONS[s.icon]}</g>`;
    b += T(s.title, { x: 24, y: 114, size: 25, w: "semi", ls: -0.3 });
    s.text.forEach((t, j) => (b += T(t, { x: 24, y: 144 + j * 22, size: 15.5, w: "med", op: 0.55 })));
    b += T(s.tags, { x: 24, y: 194, size: 11, w: "bold", op: 0.35, ls: 1.3 });
    b += `</g></g>`;
  });
  sizes.services = svg("services", h, b, {
    title: "Services: " + ME.services.map((s) => s.title).join(", "),
    defs: glow("g1", "#B3261E", 0.22),
  });
}

/* ------------------------------------------------------------------ */
/* 3. Toolset                                                          */
/* ------------------------------------------------------------------ */
/** Adobe-style app tile: dark tile, coloured letters (real Simple Icons glyphs). */
function adobeIcon(icon, bg, fg, x, y, s, id) {
  const k = s / 24;
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${s}" height="${s}">
    <rect x="${x + k}" y="${y + k}" width="${s - 2 * k}" height="${s - 2 * k}" rx="${4 * k}" fill="#fff"/>
    <path d="${icon.path}" transform="translate(${x} ${y}) scale(${k})" fill="#000"/></mask>
  <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.2}" fill="${bg}"/>
  <rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${fg}" mask="url(#${id})"/>
  <rect x="${x + 0.5}" y="${y + 0.5}" width="${s - 1}" height="${s - 1}" rx="${s * 0.2}" fill="none" stroke="${fg}" stroke-opacity=".25"/>`;
}
/** Dark tile with a full-colour or single-colour logo centred inside. */
function tileIcon(inner, x, y, s, bg = "#141414") {
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.2}" fill="${bg}"/>
  <rect x="${x + 0.5}" y="${y + 0.5}" width="${s - 1}" height="${s - 1}" rx="${s * 0.2}" fill="none" stroke="#fff" stroke-opacity=".1"/>${inner}`;
}
const siLogo = (icon, x, y, size, fill) =>
  `<path d="${icon.path}" transform="translate(${x} ${y}) scale(${size / 24})" fill="${fill}"/>`;
function figmaLogo(cx, cy, hgt) {
  const k = hgt / 57;
  return `<g transform="translate(${cx - 19 * k} ${cy - 28.5 * k}) scale(${k})">
    <path d="M19 0H9.5a9.5 9.5 0 0 0 0 19H19V0z" fill="#F24E1E"/>
    <path d="M19 0h9.5a9.5 9.5 0 0 1 0 19H19V0z" fill="#FF7262"/>
    <path d="M9.5 19a9.5 9.5 0 0 0 0 19H19V19H9.5z" fill="#A259FF"/>
    <circle cx="28.5" cy="28.5" r="9.5" fill="#1ABCFE"/>
    <path d="M0 47.5A9.5 9.5 0 0 0 9.5 57 9.5 9.5 0 0 0 19 47.5V38H9.5A9.5 9.5 0 0 0 0 47.5z" fill="#0ACF83"/></g>`;
}

const TOOLS = [
  { name: "Photoshop", icon: (x, y, s, id) => adobeIcon(SI.siAdobephotoshop, "#001E36", "#31A8FF", x, y, s, id) },
  { name: "Illustrator", icon: (x, y, s, id) => adobeIcon(SI.siAdobeillustrator, "#330000", "#FF9A00", x, y, s, id) },
  { name: "Lightroom", icon: (x, y, s, id) => adobeIcon(SI.siAdobelightroom, "#001E36", "#31A8FF", x, y, s, id) },
  { name: "Premiere Pro", icon: (x, y, s, id) => adobeIcon(SI.siAdobepremierepro, "#00005B", "#9999FF", x, y, s, id) },
  { name: "After Effects", icon: (x, y, s, id) => adobeIcon(SI.siAdobeaftereffects, "#00005B", "#9999FF", x, y, s, id) },
  { name: "DaVinci Resolve", icon: (x, y, s, id) => tileIcon(`<clipPath id="${id}"><rect x="${x + s * 0.16}" y="${y + s * 0.16}" width="${s * 0.68}" height="${s * 0.68}"/></clipPath><g clip-path="url(#${id})">${siLogo(SI.siDavinciresolve, x - s * 0.02, y - s * 0.02, s * 1.04, "url(#dvr)")}</g>`, x, y, s, "#14161C") },
  { name: "Figma", icon: (x, y, s) => tileIcon(figmaLogo(x + s / 2, y + s / 2, s * 0.6), x, y, s, "#1E1E1E") },
  { name: "Claude", icon: (x, y, s) => tileIcon(siLogo(SI.siClaude, x + s * 0.2, y + s * 0.2, s * 0.6, "#D97757"), x, y, s, "#1C1410") },
  { name: "Codex", icon: (x, y, s) => tileIcon(siLogo(SI.siOpenai, x + s * 0.2, y + s * 0.2, s * 0.6, "#FFFFFF"), x, y, s, "#141414") },
];

{
  let b = plus(52, 40, 18, 4);
  b += label("WHAT I WORK WITH", 48, 82);
  b += T("Toolset", { x: 44, y: 146, size: 70, w: "bold", ls: -1.8 });
  const s = 40, top = 192, slot = (W - 96 - s) / (TOOLS.length - 1);
  TOOLS.forEach((t, i) => {
    const cx = 48 + s / 2 + slot * i;
    b += `<g class="up" style="animation-delay:${0.1 + i * 0.05}s">`;
    b += t.icon(cx - s / 2, top, s, "am" + i);
    b += T(t.name, { x: cx, y: top + s + 24, size: 12.5, w: "med", op: 0.55, anchor: "middle" });
    b += `</g>`;
  });
  const h = top + s + 62;
  sizes.tools = svg("tools", h, b, {
    title: "Toolset: " + TOOLS.map((t) => t.name).join(", "),
    defs: `<linearGradient id="dvr" x1="0" y1="0" x2="1" y2="1"><stop offset=".2" stop-color="#FF7A45"/><stop offset=".55" stop-color="#3FD0C9"/><stop offset=".85" stop-color="#3D8BFF"/></linearGradient>`,
  });
}

/* ------------------------------------------------------------------ */
/* 4. Footer                                                           */
/* ------------------------------------------------------------------ */
{
  const h = 400;
  let b = `<ellipse cx="300" cy="${h + 40}" rx="520" ry="220" fill="url(#g1)" class="breathe"/><ellipse cx="820" cy="${h + 60}" rx="360" ry="200" fill="url(#g2)" class="breathe" style="animation-delay:-4s"/>`;
  b += T(ME.first, { x: 44, y: 160, size: 88, w: "bold", ls: -2 });
  b += plus(44 + measure(ME.first, 88, "bold", -2) + 16, 96, 24, 6);
  ME.footer.text.forEach((t, i) => (b += T(t, { x: 48, y: 204 + i * 25, size: 16.5, w: "med", op: 0.6 })));
  b += pill(48, 252, ME.footer.button).svg;
  ME.footer.info.forEach(([k, v], i) => {
    const y = 92 + i * 64;
    b += T(k, { x: W - 48, y, size: 13, w: "bold", op: 0.45, ls: 1.3, anchor: "end" });
    b += T(v, { x: W - 48, y: y + 28, size: 20, w: "semi", anchor: "end" });
  });
  b += `<line x1="48" y1="${h - 72}" x2="${W - 48}" y2="${h - 72}" stroke="#fff" stroke-opacity=".1"/>`;
  b += T(ME.footer.left, { x: 48, y: h - 34, size: 15, w: "med", op: 0.7 });
  sizes.footer = svg("footer", h, b, {
    title: "Saeed Ijaz — Dubai, UAE",
    defs: `${glow("g1", "#B3261E", 0.35)}${glow("g2", "#5B2A86", 0.3)}`,
  });
}

console.log(Object.fromEntries(Object.entries(sizes).map(([k, v]) => [k, `${(v / 1024).toFixed(0)} KB`])));
