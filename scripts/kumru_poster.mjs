// The README's hero poster, docs/poster.png (1280×640, also the repo's social preview): Kerim from the Sahne kit
// (sahne-kit/kerim/art), the name, and six story thumbnails from data/thumbs. Drawn in Chromium by Playwright, with
// the page's fonts from Google Fonts, so it needs the network. Run it again after changing Kerim or the thumbnails:
// `node scripts/kumru_poster.mjs`. Not a gate (fonts and Chromium differ between machines); the PNG is committed.
import { readFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { KERIM_ART } from "../sahne/packages/sahne-kit/src/kerim/art.ts";
import { ROOT } from "./data.mjs";

const THUMBS = ["s1e01", "s1e12", "s1e04", "s1e48", "s1e06", "s1e18"];
const OUT = path.join(ROOT, "docs/poster.png");

const thumb = (id) => `data:image/webp;base64,${readFileSync(path.join(ROOT, "data/thumbs", id + ".webp")).toString("base64")}`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Source+Serif+4:ital,opsz,wght@1,8..60,400&family=Vazirmatn:wght@500&display=swap">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1280px;height:640px;overflow:hidden;background:#FFF8EC;font-family:Outfit,sans-serif;color:#262A1C;position:relative}
  .blob{position:absolute;border-radius:50%;filter:blur(2px)}
  .b1{width:760px;height:760px;right:-220px;top:-160px;background:#E7ECDA}
  .b2{width:340px;height:340px;left:-120px;bottom:-150px;background:#F6E6CF}
  .left{position:absolute;left:72px;top:52px;width:560px}
  .kerim{position:absolute;left:52px;bottom:22px;width:220px;height:220px;filter:drop-shadow(0 14px 18px rgba(68,51,34,.18))}
  .bubble{position:absolute;left:250px;bottom:196px;background:#FFFDF8;border-radius:22px;padding:12px 20px;font-weight:600;font-size:26px;
    box-shadow:0 8px 22px rgba(68,51,34,.12)}
  .bubble:after{content:"";position:absolute;left:18px;bottom:-12px;border:12px solid transparent;border-top-color:#FFFDF8;border-bottom:0}
  h1{font-size:116px;font-weight:700;letter-spacing:-4px;line-height:1}
  h2{font-size:34px;font-weight:600;color:#546B41;margin-top:4px}
  p{font-family:"Source Serif 4",serif;font-style:italic;font-size:25px;line-height:1.35;color:#454A39;margin-top:22px;width:520px}
  .fa{font-family:Vazirmatn,sans-serif;font-size:24px;color:#546B41;margin-top:12px;direction:rtl;text-align:left;unicode-bidi:plaintext}
  .url{position:absolute;left:292px;bottom:58px;background:#262A1C;color:#FFF8EC;border-radius:999px;padding:14px 26px;font-size:26px;font-weight:600}
  .grid{position:absolute;right:56px;top:58px;display:grid;grid-template-columns:repeat(2,264px);gap:22px;transform:rotate(-4deg)}
  .grid img{width:264px;height:165px;object-fit:cover;border-radius:20px;border:5px solid #FFFDF8;box-shadow:0 12px 26px rgba(68,51,34,.16)}
  .grid img:nth-child(even){transform:translateY(34px)}
</style></head><body>
<div class="blob b1"></div><div class="blob b2"></div>
<div class="grid">${THUMBS.map((id) => `<img src="${thumb(id)}">`).join("")}</div>
<div class="left">
  <h1>Kumru</h1>
  <h2>Turkish Notebook</h2>
  <p>Word cards, grammar lessons, a skill path and a daily story on a paper-theatre stage. A1 to B1.</p>
  <div class="fa">تمرین ترکی، هر روز یک داستان</div>
</div>
<div class="kerim">${KERIM_ART}</div>
<div class="bubble">Merhaba!</div>
<div class="url">turk.shab.boo</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => globalThis.document.fonts.ready);
await page.screenshot({ path: OUT });
await browser.close();
console.log("poster: wrote " + path.relative(ROOT, OUT));
