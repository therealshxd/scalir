// Generates the 1200×630 social share image at public/og.png, on-brand with the app's design
// tokens (see src/app.css). One-off/dev tool — run `npm run og` to regenerate; the PNG is committed.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logo = readFileSync(path.join(root, 'public/pwa-512.png')).toString('base64');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:1200px; height:630px; }
  body {
    font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: radial-gradient(1100px 700px at 80% 15%, #16222c 0%, #0f1115 62%);
    color:#e6e8ec; padding:78px 88px; display:flex; flex-direction:column;
    justify-content:center; position:relative; overflow:hidden;
  }
  .brand { display:flex; align-items:center; gap:22px; margin-bottom:36px; }
  .brand img { width:76px; height:76px; border-radius:18px; }
  .brand span { font-size:42px; font-weight:800; letter-spacing:-0.5px; }
  h1 { font-size:86px; line-height:1.02; font-weight:800; letter-spacing:-2.5px; max-width:1000px; }
  .accent { background:linear-gradient(90deg,#22d3ee,#38c172);
    -webkit-background-clip:text; background-clip:text; color:transparent; }
  p.sub { font-size:34px; color:#9aa3b2; margin-top:30px; max-width:940px; line-height:1.32; }
  .chips { display:flex; gap:14px; margin-top:46px; }
  .chip { font-size:24px; font-weight:600; color:#cfd6e2; border:1.5px solid #2a2f3a;
    background:#181b22; border-radius:999px; padding:11px 24px; }
  .url { position:absolute; right:88px; bottom:70px; font-size:27px; font-weight:700; color:#22d3ee; }
</style></head><body>
  <div class="brand"><img src="data:image/png;base64,${logo}" alt=""><span>Scalir</span></div>
  <h1>Free <span class="accent">Bulk Image Compressor</span></h1>
  <p class="sub">Compress, resize &amp; convert images — private, free, and 100% in your browser. No uploads, ever.</p>
  <div class="chips">
    <span class="chip">WebP · AVIF</span><span class="chip">HEIC · TIFF</span>
    <span class="chip">No uploads</span><span class="chip">Open source</span>
  </div>
  <div class="url">scalir.org</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
const out = path.join(root, 'public/og.png');
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log('wrote', path.relative(root, out));
