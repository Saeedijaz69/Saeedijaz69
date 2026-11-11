// Builds the profile README graphics (assets/*.svg).
//
// The layout is a 1:0.75 translation of the Framer template
// (1200px container -> 900px inside a 1000px card). Small text is set a little
// larger than a strict 0.75 scale so it stays readable at GitHub's width.
// Every piece of text is converted to vector outlines with Inter (the same
// files the Framer site serves), so it looks identical on every device.
//
//   npm run build
//
import opentype from "opentype.js";
import hbInit from "harfbuzzjs";
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
  logo: "Saeed",
  location: "Dubai, UAE",
  hello: "Hello, I’m Saeed Ijaz",
  title: ["DESIGNER+", "DEVELOPER"],
  intro:
    "A designer and developer based in Dubai. I build brands, products and motion, shoot and edit along the way, and work with the latest AI to go from idea to finished, fast.",
  status: "Available for work",
  toolsLabel: "TOOLKIT",
  tools: [
    ["Figma", SI.siFigma],
    ["Photoshop", SI.siAdobephotoshop],
    ["Illustrator", SI.siAdobeillustrator],
    ["After Effects", SI.siAdobeaftereffects],
    ["Claude", SI.siClaude],
    ["Codex", SI.siOpenai],
  ],
  services: [
    {
      title: "Branding",
      tags: ["Identity", "Strategy", "Social"],
      text: "Brand identities that build trust and stay consistent everywhere they show up.",
    },
    {
      title: "Product Design",
      tags: ["Website", "App", "Design Systems"],
      text: "Interfaces that feel simple and clear, from the first sketch to the final pixel.",
    },
    {
      title: "Development",
      tags: ["Web", "Windows", "Android"],
      text: "Turning designs into real, working apps and sites, built fast with the latest AI.",
    },
    {
      title: "Motion Design",
      tags: ["Motion Graphics", "Video", "3D"],
      text: "Animation and video that give a brand rhythm and keep people watching.",
    },
  ],
  projects: [
    {
      name: "Couch",
      text: "Your Android phone becomes a trackpad, keyboard and media remote for your Windows PC.",
      chip: "Windows · Android",
      image: "couch",
    },
    {
      name: "Duet",
      text: "Plays your PC’s sound on two headphones at once, perfectly in sync, so two people can watch one movie.",
      chip: "Windows",
      image: "duet",
    },
  ],
  footer: {
    heading: ["HAVE A PROJECT", "IDEA? LET’S TALK"],
    chip: "Open for projects",
    columns: [
      ["SERVICES", ["Branding", "Product Design", "Development", "Motion Design"]],
      ["PROJECTS", ["Couch", "Duet"]],
      ["LOCATION", ["Dubai, UAE", "GMT+4"]],
    ],
    copyright: `© ${new Date().getFullYear()} Saeed Ijaz. All Rights Reserved`,
  },
};

/* ------------------------------------------------------------------ */
/* Design tokens (read from the Framer site's computed styles)         */
/* ------------------------------------------------------------------ */
const W = 1000;
const S = 0.75; // Framer px -> card px
const M = 50; // card side margin (Framer container left edge, 113px)
const X = (x) => M + (x - 113) * S;
const C = {
  page: "#FFFFFF",
  soft: "#F9F9F9", // footer + light buttons
  ink: "#0C0407",
  muted: "#666666",
  item: "#333333",
  gray: "#808080",
  line: "#CACACA",
  logo: "#7A7A7A", // the greyed client/tool logos
  green: "#22C55E",
};

const FILES = {
  400: join(ROOT, "src/fonts/Inter-Regular.ttf"),
  500: join(ROOT, "src/fonts/Inter-Medium.ttf"),
  600: join(ROOT, "src/fonts/Inter-SemiBold.ttf"),
  700: join(ROOT, "src/fonts/Inter-Bold.ttf"),
};
const F = Object.fromEntries(Object.entries(FILES).map(([w, file]) => [w, opentype.loadSync(file)]));
const ASC = 1984 / 2048;
const CONTENT = (1984 + 494) / 2048;
const CAP = 1490 / 2048;

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */
// Shaping with HarfBuzz (the engine Chrome uses), so kerning and advances
// match the browser exactly; opentype.js only supplies the outlines.
const hb = await hbInit;
const HB = Object.fromEntries(
  Object.entries(FILES).map(([w, file]) => [w, hb.createFont(hb.createFace(hb.createBlob(readFileSync(file)), 0))]),
);

/** CSS-like layout: shaped advances, letter-spacing after every glyph. */
function layout(w, str, size, ls) {
  const buf = hb.createBuffer();
  buf.addText(str);
  buf.guessSegmentProperties();
  // like Chrome: letter-spacing turns off ligatures and contextual alternates
  hb.shape(HB[w], buf, ls ? "-liga,-clig,-dlig,-hlig,-calt" : "");
  const out = buf.json();
  buf.destroy();
  const k = size / F[w].unitsPerEm;
  let x = 0;
  const items = [];
  for (const g of out) {
    items.push({ g: F[w].glyphs.get(g.g), x: x + g.dx * k, y: -g.dy * k });
    x += g.ax * k + ls;
  }
  return { items, width: x };
}
const em = (size, pct) => size * pct; // letter-spacing given in em
const measure = (str, size, w = 400, ls = 0) => layout(w, str, size, ls).width;
/** First baseline of a CSS line box: top + half-leading + ascender. */
const base = (top, lh, size) => top + (lh - CONTENT * size) / 2 + ASC * size;

/** Text as a single <path>. y is the baseline. */
function T(str, { x, y, size, w = 400, fill = C.ink, ls = 0, anchor = "start", cls, style }) {
  const L = layout(w, str, size, ls);
  const x0 = anchor === "middle" ? x - L.width / 2 : anchor === "end" ? x - L.width : x;
  let d = "";
  for (const it of L.items) d += it.g.getPath(x0 + it.x, y + it.y, size).toPathData(size > 40 ? 1 : 2);
  return `<path d="${d}" fill="${fill}"${cls ? ` class="${cls}"` : ""}${style ? ` style="${style}"` : ""}/>`;
}

/** Greedy word wrap. */
function wrap(str, size, w, ls, maxW) {
  const words = str.split(" ");
  const lines = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? cur + " " + word : word;
    if (cur && measure(next, size, w, ls) > maxW) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** A paragraph block. Returns svg + bottom edge of its last line box. */
function para(str, { x, top, size, lh, w = 400, fill = C.ink, ls = 0, maxW, anchor, cls, delay = 0 }) {
  const lines = wrap(str, size, w, ls, maxW);
  let s = "";
  lines.forEach((ln, i) => {
    s += T(ln, { x, y: base(top + i * lh, lh, size), size, w, fill, ls, anchor });
  });
  return { svg: anim(s, delay, cls), bottom: top + lines.length * lh, lines };
}

const anim = (inner, delay = 0, cls = "up") => `<g class="${cls}" style="animation-delay:${delay.toFixed(2)}s">${inner}</g>`;

/* ------------------------------------------------------------------ */
/* Card wrapper                                                        */
/* ------------------------------------------------------------------ */
const CSS = `
  .up{animation:up 1s cubic-bezier(.16,1,.3,1) both}
  @keyframes up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
  .fade{animation:fade 1.4s ease both}
  @keyframes fade{from{opacity:0}to{opacity:1}}
  .pulse{animation:pulse 2.4s ease-in-out infinite}
  @keyframes pulse{50%{opacity:.4}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}
`;
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const sizes = {};
function svg(name, h, body, { bg = C.page, title, defs = "" }) {
  const t = esc(title);
  const out = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="${t}">
<title>${t}</title>
<style>${CSS}</style>
<defs>
  <clipPath id="card"><rect width="${W}" height="${h}" rx="20"/></clipPath>
  ${defs}
</defs>
<g clip-path="url(#card)">
  <rect width="${W}" height="${h}" fill="${bg}"/>
  ${body}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${h - 1}" rx="19.5" fill="none" stroke="${C.ink}" stroke-opacity=".08"/>
</svg>
`;
  writeFileSync(join(OUT, `${name}.svg`), out);
  sizes[name] = `${(out.length / 1024).toFixed(0)} KB`;
}

/** Load, crop and embed a photo as a 2x JPEG data URI. */
async function photo(file, w, h, crop) {
  const src = join(ROOT, "src/images", file);
  if (!existsSync(src)) return null;
  let img = sharp(src);
  if (crop) img = img.extract(crop);
  const buf = await img
    .resize({ width: Math.round(w * 2), height: Math.round(h * 2), fit: "cover", position: "centre" })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

/** A filled button (rectangle, square corners — as in the template). */
function button(x, top, text, { h = 38, size = 15, w = 600, fill = C.ink, color = "#fff", pad = 18, dot, stroke } = {}) {
  const lead = dot ? 15 : 0;
  const tw = measure(text, size, w, em(size, -0.02));
  const bw = tw + pad * 2 + lead;
  let s = `<rect x="${x}" y="${top}" width="${bw}" height="${h}" fill="${fill}"${stroke ? ` stroke="${stroke}"` : ""}/>`;
  if (dot) s += `<circle class="pulse" cx="${x + pad + 4}" cy="${top + h / 2}" r="4" fill="${dot}"/>`;
  s += T(text, { x: x + pad + lead, y: top + h / 2 + (CAP * size) / 2, size, w, fill: color, ls: em(size, -0.02) });
  return { svg: s, w: bw };
}

/* ------------------------------------------------------------------ */
/* 1. Hero                                                             */
/* ------------------------------------------------------------------ */
{
  const Y = (y) => 6 + y * S; // Framer page y -> card y
  let b = "";

  // header: logo + location chip (Framer: logo 80x34 @ y23, Contact button 40px @ y20)
  b += anim(T(ME.logo, { x: M, y: Y(40) + (CAP * 22) / 2, size: 22, w: 700, ls: em(22, -0.03) }), 0, "fade");
  {
    const size = 14, h = 34, pad = 15;
    const tw = measure(ME.location, size, 600, em(size, -0.02));
    const bw = tw + pad * 2;
    const x = W - M - bw, top = Y(40) - h / 2;
    b += anim(
      `<rect x="${x}" y="${top}" width="${bw}" height="${h}" fill="#fff" stroke="${C.ink}" stroke-opacity=".12"/>` +
        T(ME.location, { x: x + pad, y: top + h / 2 + (CAP * size) / 2, size, w: 600, ls: em(size, -0.02) }),
      0,
      "fade",
    );
  }

  // "Hello, I'm …"  32px/36 regular, -3%  ->  24px
  b += anim(T(ME.hello, { x: W / 2, y: base(Y(205), 36 * S, 24), size: 24, w: 400, ls: em(24, -0.03), anchor: "middle" }), 0.05);

  // DESIGNER+ / DEVELOPER  180px/160 bold, -8%, centred  ->  135px
  const hs = 180 * S;
  ME.title.forEach((line, i) => {
    b += anim(T(line, { x: W / 2, y: base(Y(301 + i * 160), 160 * S, hs), size: hs, w: 700, ls: em(hs, -0.08), anchor: "middle" }), 0.12 + i * 0.1);
  });

  // portrait — Framer: 444x480 @ (869, 681)
  const px = X(869), py = Y(681), pw = 444 * S, ph = 480 * S;
  const uri = await photo("portrait.jpg", pw, ph, { left: 160, top: 236, width: 720, height: 778 });
  b += anim(
    uri
      ? `<image x="${px}" y="${py}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid slice" href="${uri}"/>`
      : `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#E6E6E6"/>`,
    0.3,
  );

  // intro paragraph (Framer: 14/20 @ y681, 501 wide)
  const p = para(ME.intro, { x: M, top: py, size: 15.5, lh: 23, fill: C.ink, ls: em(15.5, -0.01), maxW: 430, delay: 0.35 });
  b += p.svg;

  // status button (Framer: "Contact Now", 40px high, 40px below the paragraph)
  const btn = button(M, p.bottom + 30, ME.status, { dot: C.green });
  b += anim(btn.svg, 0.45);

  // toolkit — takes the place of "Featured clients": label + 3x2 grey logos,
  // the last row sitting on the portrait's bottom edge (as in the template)
  const rowH = 18, pitch = 54 * S, colW = 142;
  const row2 = py + ph - rowH;
  const row1 = row2 - pitch;
  b += anim(T(ME.toolsLabel, { x: M, y: base(row1 - 38 * S, 14, 12), size: 12, w: 600, ls: em(12, -0.02) }), 0.5);
  ME.tools.forEach(([name, icon], i) => {
    const x = M + (i % 3) * colW;
    const top = i < 3 ? row1 : row2;
    const s = 17;
    let t = `<path d="${icon.path}" transform="translate(${x} ${top + (rowH - s) / 2}) scale(${s / 24})" fill="${C.logo}"/>`;
    t += T(name, { x: x + s + 7, y: top + rowH / 2 + (CAP * 15) / 2, size: 15, w: 600, fill: C.logo, ls: em(15, -0.02) });
    b += anim(t, 0.55 + i * 0.04);
  });

  const h = Math.round(py + ph + 64);
  svg("hero", h, b, { title: "Hello, I'm Saeed Ijaz — designer and developer based in Dubai" });
}

/* ------------------------------------------------------------------ */
/* 2. Services                                                         */
/* ------------------------------------------------------------------ */
{
  const top = 64;
  let b = "";
  const hs = 100 * S;
  b += anim(T("SERVICES", { x: M, y: base(top, 89 * S, hs), size: hs, w: 700, ls: em(hs, -0.08) }), 0);

  const colX = X(774); // [01] + title
  const tagX = 736; // tags + description
  const right = W - M;
  const descW = right - tagX;
  let y = top;
  ME.services.forEach((s, i) => {
    let r = "";
    // [01]  14/20 semibold
    r += T(`[0${i + 1}]`, { x: colX, y: base(y, 20, 14), size: 14, w: 600, ls: em(14, -0.02) });
    // title 24/28 semibold, -3%, 40px below the number
    r += T(s.title, { x: colX, y: base(y + 40 * S, 28, 21), size: 21, w: 600, ls: em(21, -0.03) });
    // tags  "Brand • Strategy • Communication"
    let tx = tagX;
    s.tags.forEach((tag, j) => {
      if (j) {
        r += `<circle cx="${tx + 7.5}" cy="${y + 10 - 0.5}" r="1.9" fill="${C.ink}"/>`;
        tx += 15;
      }
      r += T(tag, { x: tx, y: base(y, 20, 13.5), size: 13.5, w: 600, ls: em(13.5, -0.02) });
      tx += measure(tag, 13.5, 600, em(13.5, -0.02));
    });
    if (tx > right) console.warn(`! tags overflow in "${s.title}" by ${(tx - right).toFixed(1)}px`);
    // description 14/20 regular #666, 32px below the row top
    const d = para(s.text, { x: tagX, top: y + 32 * S, size: 14.5, lh: 21, fill: C.muted, ls: em(14.5, -0.01), maxW: descW });
    r += d.svg;
    const titleBottom = y + 40 * S + 28;
    const divider = Math.max(d.bottom, titleBottom) + 58 * S;
    r += `<rect x="${colX}" y="${divider}" width="${right - colX}" height="1" fill="${C.line}"/>`;
    b += anim(r, 0.1 + i * 0.08);
    y = divider + 1 + 62 * S;
  });
  const h = Math.round(y - 62 * S + 64);
  svg("services", h, b, { title: "Services: " + ME.services.map((s) => s.title).join(", ") });
}

/* ------------------------------------------------------------------ */
/* 3. Projects                                                         */
/* ------------------------------------------------------------------ */
{
  const top = 64;
  let b = "";
  const hs = 100 * S;
  b += anim(T("PROJECTS", { x: W / 2, y: base(top, 89 * S, hs), size: hs, w: 700, ls: em(hs, -0.08), anchor: "middle" }), 0);

  const imgTop = top + 169 * S; // Framer: images start 169px below the heading box
  const iw = 580 * S, ih = 429 * S;
  let bottom = 0;
  for (const [i, p] of ME.projects.entries()) {
    const x = i === 0 ? X(113) : X(733);
    let r = "";
    const uri = await photo(`${p.image}.jpg`, iw, ih);
    r += uri
      ? `<image x="${x}" y="${imgTop}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid slice" href="${uri}"/>`
      : `<rect x="${x}" y="${imgTop}" width="${iw}" height="${ih}" fill="#111"/>`;
    // title 32/36 semibold -3%, 12px under the image
    const tTop = imgTop + ih + 12 * S;
    r += T(p.name, { x, y: base(tTop, 30, 26), size: 26, w: 600, ls: em(26, -0.03) });
    // description 14/20 #666, 40px under the title top
    const d = para(p.text, { x, top: tTop + 40 * S, size: 15, lh: 22, fill: C.muted, ls: em(15, -0.01), maxW: iw - 20 });
    r += d.svg;
    // chip (Framer: "View Project", #F9F9F9, 8/20 padding, 23px under the text)
    const chipTop = d.bottom + 23 * S;
    const chip = button(x, chipTop, p.chip, { h: 34, size: 14, w: 500, fill: C.soft, color: C.ink, pad: 16, stroke: "#EDEDED" });
    r += chip.svg;
    bottom = Math.max(bottom, chipTop + 34);
    b += anim(r, 0.15 + i * 0.12);
  }
  const h = Math.round(bottom + 64);
  svg("projects", h, b, { title: "Projects: " + ME.projects.map((p) => `${p.name} — ${p.text}`).join(" | ") });
}

/* ------------------------------------------------------------------ */
/* 4. Footer                                                           */
/* ------------------------------------------------------------------ */
{
  const f = ME.footer;
  const Y = (y) => (y - 9400) * S; // Framer footer section starts at y9400
  const top = Y(9520);
  let b = "";
  // heading 60/72 bold -8% uppercase -> 45px
  const hs = 60 * S, lh = 72 * S;
  f.heading.forEach((line, i) => {
    b += anim(T(line, { x: M, y: base(top + i * lh, lh, hs), size: hs, w: 700, ls: em(hs, -0.08) }), 0.05 + i * 0.06);
  });
  // black chip (Framer: "Contact Now" 16/600, 16/28 padding, 54px high @ y9694)
  const chipTop = Y(9694);
  const chip = button(M, chipTop, f.chip, { h: 42, size: 15, pad: 21, dot: C.green });
  b += anim(chip.svg, 0.2);

  // columns: header 14/700, items 14/400 #333 on a 44px rhythm
  const gap = 44;
  const widths = f.columns.map(([hd, items]) =>
    Math.max(measure(hd, 13, 700, em(13, -0.02)), ...items.map((t) => measure(t, 14, 400, em(14, -0.01)))),
  );
  let cx = W - M - widths.reduce((a, b) => a + b, 0) - gap * (widths.length - 1);
  let colBottom = 0;
  f.columns.forEach(([hd, items], i) => {
    const hTop = top; // headers share the heading's top edge
    let c = T(hd, { x: cx, y: base(hTop, 21, 13), size: 13, w: 700, ls: em(13, -0.02) });
    items.forEach((t, j) => {
      const iTop = Y(9565) + j * 44 * S;
      c += T(t, { x: cx, y: base(iTop, 20, 14), size: 14, w: 400, fill: C.item, ls: em(14, -0.01) });
      colBottom = Math.max(colBottom, iTop + 20);
    });
    b += anim(c, 0.15 + i * 0.06);
    cx += widths[i] + gap;
  });

  // divider @ y9827, copyright 14/20 #808080 @ y9856, section ends @ y9904
  const divider = Math.max(Y(9827), Math.max(chipTop + 42, colBottom) + 40);
  b += `<rect x="${M}" y="${divider}" width="${W - 2 * M}" height="1" fill="${C.ink}" fill-opacity=".1"/>`;
  const cTop = divider + (9856 - 9827) * S - 2.5;
  b += anim(T(f.copyright, { x: W / 2, y: base(cTop, 20, 14), size: 14, w: 400, fill: C.gray, ls: em(14, -0.01), anchor: "middle" }), 0.3, "fade");
  const h = Math.round(cTop + 20 + (9904 - 9876) * S + 4);
  svg("footer", h, b, { bg: C.soft, title: "Saeed Ijaz — Dubai, UAE" });
}

console.log(sizes);
