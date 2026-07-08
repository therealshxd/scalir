// Generates the on-page SEO illustrations in public/img/*.webp. Six are original, on-brand graphics
// built from the app's design tokens (see src/app.css). The before/after "compression rate" image is
// built from a REAL photo — scripts/assets/compression-demo-autumn-lake.jpg (Pexels, photo 28831325,
// Pexels License: free commercial use, no attribution required) — which is actually compressed here
// (canvas → WebP) so the "before/after" byte labels on the graphic are the true numbers, not made up.
// Each template is rendered headlessly at 2× for crispness, then transcoded to WebP entirely in
// Chromium (canvas.toDataURL), auto-tuning quality to stay under ~150 KB. One-off dev tool:
//   npm run seo:img   (node scripts/seo-images.mjs)
// The .webp outputs and the source photo are committed; re-run only when you want to regenerate them.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'img');
mkdirSync(outDir, { recursive: true });

const MAX_BYTES = 150 * 1024;

// ── shared building blocks ──────────────────────────────────────────────────────────────────────
const CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  :root { --bg:#0f1115; --panel:#181b22; --line:#2a2f3a; --text:#e6e8ec; --muted:#9aa3b2;
    --accent:#22d3ee; --ok:#38c172; }
  html,body { font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:var(--text); }
  body { background:radial-gradient(1000px 640px at 82% 12%, #16222c 0%, #0f1115 62%);
    display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .stage { width:100%; height:100%; padding:56px 64px; display:flex; flex-direction:column; }
  .wm { position:absolute; right:34px; bottom:26px; font-size:22px; font-weight:800; color:var(--accent);
    letter-spacing:.2px; display:flex; align-items:center; gap:9px; }
  .wm .dot { width:16px; height:16px; border-radius:5px;
    background:linear-gradient(135deg,var(--accent),var(--ok)); }
  .kicker { font-size:19px; font-weight:700; color:var(--accent); letter-spacing:.4px;
    text-transform:uppercase; margin-bottom:14px; }
  .accent { background:linear-gradient(90deg,var(--accent),#7af0ff);
    -webkit-background-clip:text; background-clip:text; color:transparent; }
  .panel { background:var(--panel); border:1px solid var(--line); border-radius:18px; }
  .photo { border-radius:14px; position:relative; overflow:hidden; }
  .shot { background-size:cover; background-position:center; }
  .tag { position:absolute; font-size:20px; font-weight:800; padding:9px 16px; border-radius:999px;
    backdrop-filter:blur(3px); }
  h1 { font-size:52px; line-height:1.06; font-weight:800; letter-spacing:-1.2px; }
  .sub { font-size:26px; color:var(--muted); margin-top:14px; line-height:1.35; }
  .chips { display:flex; gap:12px; flex-wrap:wrap; margin-top:26px; }
  .chip { font-size:20px; font-weight:700; color:#cfd6e2; border:1.5px solid var(--line);
    background:var(--panel); border-radius:999px; padding:9px 20px; }
  .chip.ok { color:var(--ok); border-color:#1e5c38; background:rgba(56,193,114,.12); }
  .chip.ac { color:var(--accent); border-color:#164a55; background:rgba(34,211,238,.10); }
  .browser { border:1px solid var(--line); border-radius:16px; overflow:hidden; background:var(--panel); }
  .bbar { display:flex; align-items:center; gap:10px; padding:14px 18px; border-bottom:1px solid var(--line);
    background:#12151b; }
  .bdot { width:13px; height:13px; border-radius:50%; }
  .url { margin-left:12px; font-size:18px; color:var(--muted); background:#0f1218; border:1px solid var(--line);
    border-radius:8px; padding:7px 16px; flex:1; }
  .grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .arrow { color:var(--accent); font-size:64px; font-weight:800; line-height:1; }
  .term { background:#0b0e13; border:1px solid var(--line); border-radius:14px; padding:22px 24px;
    font:20px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace; color:#cfd6e2; }
  .term .c { color:var(--ok); } .term .a { color:var(--accent); } .term .m { color:var(--muted); }
  /* real-photo before/after compare */
  .pa { position:absolute; inset:0; background-size:cover; background-position:center; }
  .shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(15,17,21,.5) 0%,
    rgba(15,17,21,0) 20%, rgba(15,17,21,0) 60%, rgba(15,17,21,.72) 100%); }
  .divider { position:absolute; top:0; bottom:0; left:50%; width:3px; transform:translateX(-50%);
    background:rgba(255,255,255,.92); box-shadow:0 0 0 1px rgba(0,0,0,.3); }
  .handle { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:56px; height:56px;
    border-radius:50%; background:var(--accent); color:#08303a; display:flex; align-items:center;
    justify-content:center; font-size:26px; font-weight:800; box-shadow:0 8px 22px rgba(0,0,0,.45); }
  .lbl { position:absolute; top:24px; font-size:21px; font-weight:800; padding:8px 17px; border-radius:999px;
    background:rgba(15,17,21,.74); color:#fff; }
  .lbl.tl { left:24px; } .lbl.tr { right:24px; color:var(--accent); }
  .stat { position:absolute; bottom:24px; font-size:23px; font-weight:800; padding:10px 17px;
    border-radius:12px; background:rgba(15,17,21,.8); color:#fff; }
  .stat.bl { left:24px; } .stat.br { right:24px; color:var(--ok); }
  .badge2 { position:absolute; top:24px; left:50%; transform:translateX(-50%); font-size:25px;
    font-weight:800; color:#06230f; background:var(--ok); padding:8px 20px; border-radius:999px;
    box-shadow:0 6px 18px rgba(0,0,0,.35); }
`;
const WM = `<div class="wm"><span class="dot"></span>Scalir</div>`;
// A few colourful gradients that read as "a photo" without being one.
const PH = [
  'linear-gradient(135deg,#ff8a5b 0%,#d84fa0 45%,#7c5cff 100%)',
  'linear-gradient(135deg,#22d3ee 0%,#3b82f6 55%,#7c3aed 100%)',
  'linear-gradient(135deg,#38c172 0%,#22d3ee 60%,#3b82f6 100%)',
  'linear-gradient(135deg,#f6c343 0%,#ff8a5b 55%,#ef5350 100%)',
];

// The before/after, resize and HEIC demos use REAL photos from Pexels (Pexels License: free
// commercial use, no attribution required), fetched on demand into scripts/assets/ (gitignored) —
// the committed public/img/*.webp outputs are the deliverables. The before/after is the strongest
// case for a real photo: its full-resolution source is actually compressed here so the byte labels
// are true. Photo pages: /photo/28831325 (autumn lake), /photo/957013 (alpine lake), /photo/16155640.
const ASSETS = path.join(root, 'scripts/assets');
const PHOTOS = {
  compare: ['compression-demo-autumn-lake.jpg', 'https://images.pexels.com/photos/28831325/pexels-photo-28831325.jpeg'],
  resize: ['resize-demo-konigssee.jpg', 'https://images.pexels.com/photos/957013/konigssee-long-exposure-bavaria-view-957013.jpeg?auto=compress&cs=srgb&w=3000'],
  heic: ['heic-demo-portrait.jpg', 'https://images.pexels.com/photos/16155640/pexels-photo-16155640.jpeg?auto=compress&cs=srgb&w=1400'],
};

// Same photo both sides (compression keeps the visible quality identical) split by a compare divider;
// the corner labels carry the real before/after byte sizes and reduction.
const photoBody = (photoDataUrl, beforeStr, afterStr, pct) => `<div class="stage" style="padding:0;">
  <div class="pa" style="background-image:url('${photoDataUrl}');"></div>
  <div class="shade"></div>
  <div class="divider"></div><div class="handle">⟷</div>
  <div class="lbl tl">Before</div>
  <div class="lbl tr">After</div>
  <div class="badge2">−${pct}%</div>
  <div class="stat bl">${beforeStr} · JPEG</div>
  <div class="stat br">${afterStr} · WebP</div>
</div>`;

// Real photo shown at two dimensions (cover-fit) with the true original + web-capped size labels.
const resizeBody = (photo, bw, bh, tw, th) => `<div class="stage">
  <div class="kicker">Resize images online</div>
  <div style="flex:1; display:flex; align-items:center; gap:26px;">
    <div class="photo shot" style="width:520px;height:300px;background-image:url('${photo}');
      outline:3px dashed rgba(230,232,236,.5);outline-offset:8px;">
      <div class="tag" style="bottom:14px;left:14px;background:rgba(15,17,21,.78);color:#fff;font-size:18px;">${bw} × ${bh}</div>
    </div>
    <div style="text-align:center;">
      <div class="arrow">→</div>
      <div style="color:var(--accent);font-weight:800;font-size:20px;margin-top:6px;">Lanczos3</div>
    </div>
    <div class="photo shot" style="width:300px;height:173px;background-image:url('${photo}');">
      <div class="tag" style="bottom:12px;left:12px;background:rgba(15,17,21,.8);color:var(--accent);border:1.5px solid #164a55;font-size:17px;">${tw} × ${th}</div>
    </div>
  </div>
  <div class="sub">Downscale without losing quality — aspect ratio always kept.</div>
  ${WM}
</div>`;

// iPhone HEIC → web-ready JPG. Same real photo in the phone and the exported file card. No size claim:
// HEIC→JPG is about compatibility (JPEG opens everywhere), not necessarily a smaller file.
const heicBody = (photo) => `<div class="stage">
  <div class="kicker">Convert HEIC → JPG</div>
  <div style="flex:1; display:flex; align-items:center; justify-content:center; gap:30px;">
    <div style="width:230px;height:360px;border:6px solid #2a2f3a;border-radius:38px;padding:10px;background:#0b0e13;position:relative;">
      <div class="photo shot" style="width:100%;height:100%;border-radius:26px;background-image:url('${photo}');"></div>
      <div class="tag" style="bottom:22px;left:50%;transform:translateX(-50%);background:rgba(15,17,21,.8);color:#fff;font-size:16px;white-space:nowrap;">IMG_4021.HEIC</div>
    </div>
    <div class="arrow">→</div>
    <div class="panel" style="width:300px;padding:20px;">
      <div class="photo shot" style="height:200px;background-image:url('${photo}');background-position:center 28%;border-radius:10px;"></div>
      <div style="margin-top:14px;font-size:20px;font-weight:800;">photo.jpg</div>
      <div style="color:var(--muted);font-size:17px;margin-top:4px;">Web-ready · opens everywhere</div>
    </div>
  </div>
  <div class="sub">Decode iPhone photos and export a web-ready JPG in seconds.</div>
  ${WM}
</div>`;

// ── the concept graphics (filename → size + body) ────────────────────────────────────────────────
const IMAGES = [
  {
    file: 'private-in-browser-image-optimiser.webp', w: 1000, h: 720,
    body: `<div class="stage" style="justify-content:center;">
      <div class="kicker">Private · in your browser</div>
      <div class="browser">
        <div class="bbar">
          <span class="bdot" style="background:#ef5350"></span>
          <span class="bdot" style="background:#f6c343"></span>
          <span class="bdot" style="background:#38c172"></span>
          <span class="url">🔒 scalir.org — nothing uploaded</span>
        </div>
        <div style="padding:22px;">
          <div class="grid3">
            ${[0,1,2,3,2,1].map((p,i)=>`<div class="photo" style="height:120px;background:${PH[p]}">${i===1?'<div class=\"tag\" style=\"top:10px;right:10px;background:rgba(56,193,114,.9);color:#06230f;font-size:15px;padding:5px 11px;\">✓ done</div>':''}</div>`).join('')}
          </div>
        </div>
      </div>
      <div class="chips">
        <span class="chip ok">No uploads</span>
        <span class="chip ac">On your device</span>
        <span class="chip">EXIF stripped</span>
        <span class="chip">Works offline</span>
      </div>
      ${WM}
    </div>`,
  },
  {
    file: 'compress-images-for-web-workflow.webp', w: 1200, h: 600,
    body: `<div class="stage">
      <div class="kicker">Optimise images for web</div>
      <div style="flex:1; display:flex; align-items:center; justify-content:space-between; gap:20px;">
        <div class="panel" style="padding:18px;width:300px;">
          <div style="color:var(--muted);font-size:17px;margin-bottom:12px;">Source folder</div>
          <div class="grid3" style="gap:10px;">
            ${[0,1,2,3,0,2].map(p=>`<div class="photo" style="height:74px;background:${PH[p]}"></div>`).join('')}
          </div>
        </div>
        <div style="text-align:center;">
          <div class="panel" style="padding:14px 20px;color:var(--accent);font-weight:800;font-size:22px;">Scalir</div>
          <div class="arrow" style="margin-top:10px;">→</div>
        </div>
        <div class="panel" style="padding:22px;width:320px;">
          <div style="font-size:22px;font-weight:800;margin-bottom:6px;">Faster pages</div>
          <div style="color:var(--muted);font-size:17px;">Compressed, resized, WebP-ready</div>
          <div style="height:14px;border-radius:999px;background:#0f1218;margin-top:18px;overflow:hidden;border:1px solid var(--line);">
            <div style="width:82%;height:100%;background:linear-gradient(90deg,var(--accent),var(--ok));"></div>
          </div>
          <div style="color:var(--ok);font-weight:800;font-size:19px;margin-top:12px;">−78% total weight</div>
        </div>
      </div>
      <div class="sub">Client-side image compression for a whole folder at once.</div>
      ${WM}
    </div>`,
  },
  {
    file: 'desktop-image-compressor-windows-linux.webp', w: 1200, h: 675,
    body: `<div class="stage" style="justify-content:center;">
      <div class="kicker">Desktop app · fully offline</div>
      <div class="browser" style="box-shadow:0 30px 80px rgba(0,0,0,.45);">
        <div class="bbar">
          <span class="bdot" style="background:#ef5350"></span>
          <span class="bdot" style="background:#f6c343"></span>
          <span class="bdot" style="background:#38c172"></span>
          <span style="margin-left:12px;font-size:19px;font-weight:800;">Scalir</span>
          <span style="margin-left:auto;color:var(--ok);font-size:17px;font-weight:700;">● Offline</span>
        </div>
        <div style="padding:26px;display:flex;gap:20px;align-items:center;">
          <div class="grid3" style="flex:1;">
            ${[0,1,2,3,1,0].map(p=>`<div class="photo" style="height:96px;background:${PH[p]}"></div>`).join('')}
          </div>
          <div class="panel" style="width:230px;padding:18px;">
            <div style="font-weight:800;font-size:19px;margin-bottom:10px;">Optimise</div>
            <div style="color:var(--muted);font-size:16px;line-height:1.5;">Tiny · WebP<br>Max 1&nbsp;MB<br>Strip metadata</div>
            <div style="margin-top:14px;background:var(--accent);color:#08303a;text-align:center;font-weight:800;border-radius:10px;padding:10px;font-size:18px;">Run</div>
          </div>
        </div>
      </div>
      <div class="chips"><span class="chip ac">Windows 10 / 11</span><span class="chip ac">Linux · AppImage · deb · rpm</span><span class="chip ok">No internet needed</span></div>
      ${WM}
    </div>`,
  },
  {
    file: 'self-hosted-image-compressor-docker.webp', w: 1200, h: 675,
    body: `<div class="stage" style="justify-content:center;">
      <div class="kicker">Self-hosted · Docker</div>
      <div style="display:flex;gap:26px;align-items:stretch;">
        <div class="panel" style="flex:1;padding:26px;display:flex;flex-direction:column;gap:14px;justify-content:center;">
          <div style="display:flex;gap:12px;align-items:center;">
            <div style="width:54px;height:40px;border-radius:8px;background:linear-gradient(135deg,var(--accent),#3b82f6);"></div>
            <div style="width:54px;height:40px;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#7c3aed);"></div>
            <div style="width:54px;height:40px;border-radius:8px;background:linear-gradient(135deg,var(--ok),var(--accent));"></div>
          </div>
          <div style="font-size:24px;font-weight:800;">Your server</div>
          <div style="color:var(--muted);font-size:18px;">🛡️ Behind your firewall · unlimited · no data leaves your network</div>
          <div class="chips" style="margin-top:6px;"><span class="chip ok">Unlimited</span><span class="chip ac">localhost:8080</span></div>
        </div>
        <div class="term" style="flex:1;">
          <div><span class="m">$</span> git clone scalir &amp;&amp; cd scalir</div>
          <div><span class="m">$</span> <span class="c">docker</span> compose up <span class="a">-d</span></div>
          <div class="m">✔ building image…</div>
          <div class="m">✔ scalir running on <span class="a">:8080</span></div>
        </div>
      </div>
      <div class="sub" style="margin-top:22px;">A private, self-hosted image compressor in two commands.</div>
      ${WM}
    </div>`,
  },
];

// ── render + transcode ───────────────────────────────────────────────────────────────────────────
const page = (body, w, h) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
   html,body{width:${w}px;height:${h}px;position:relative;}</style></head><body>${body}</body></html>`;

const browser = await chromium.launch();
const enc = await browser.newPage(); // reused blank page for PNG→WebP transcode + measuring the demo

const fmtBytes = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.round(b / 1024) + ' KB');

// Fetch a Pexels source photo on demand into scripts/assets/ (gitignored), returning its local path.
async function fetchPhoto(key) {
  const [file, url] = PHOTOS[key];
  const dest = path.join(ASSETS, file);
  if (!existsSync(dest)) {
    mkdirSync(ASSETS, { recursive: true });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`failed to fetch ${key} photo: HTTP ${res.status}`);
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    console.log(`  fetched ${key} → ${path.relative(root, dest)} (${fmtBytes(statSync(dest).size)})`);
  }
  return dest;
}
const dataUrlFor = async (key) => 'data:image/jpeg;base64,' + readFileSync(await fetchPhoto(key)).toString('base64');
// Read a data-URL image's natural pixel dimensions in-browser.
const naturalDims = (dataUrl) =>
  enc.evaluate(async ({ dataUrl }) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    return { w: img.naturalWidth, h: img.naturalHeight };
  }, { dataUrl });

// Before/after: "before" = the full-resolution original's true size; "after" = that same photo run
// through Scalir's web-optimize pass (cap longest side 1920px + WebP q0.72), measured in-browser —
// so the byte labels are honest and reproducible.
async function buildPhotoImage() {
  const srcPath = await fetchPhoto('compare');
  const beforeBytes = statSync(srcPath).size;
  const srcDataUrl = 'data:image/jpeg;base64,' + readFileSync(srcPath).toString('base64');
  const afterBytes = await enc.evaluate(async ({ dataUrl }) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const long = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = Math.min(1, 1920 / long); // web-optimize: cap longest side at 1920, never upscale
    const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    return atob(c.toDataURL('image/webp', 0.72).split(',')[1]).length;
  }, { dataUrl: srcDataUrl });
  const pct = Math.round((1 - afterBytes / beforeBytes) * 100);
  console.log(`  compression demo: ${fmtBytes(beforeBytes)} JPEG → ${fmtBytes(afterBytes)} WebP  (−${pct}%)`);
  return {
    file: 'bulk-image-compression-before-after.webp', w: 1200, h: 600,
    body: photoBody(srcDataUrl, fmtBytes(beforeBytes), fmtBytes(afterBytes), pct),
  };
}

// Resize: label the big box with the source's true native dimensions and the small box with the
// web-capped result (longest side 1920, never upscaled) — real numbers for this exact photo.
async function buildResizeImage() {
  const dataUrl = await dataUrlFor('resize');
  const { w, h } = await naturalDims(dataUrl);
  const scale = Math.min(1, 1920 / Math.max(w, h));
  const tw = Math.round(w * scale), th = Math.round(h * scale);
  return {
    file: 'resize-images-online-lanczos.webp', w: 1000, h: 600,
    body: resizeBody(dataUrl, w, h, tw, th),
  };
}

async function buildHeicImage() {
  const dataUrl = await dataUrlFor('heic');
  return { file: 'convert-heic-to-jpg-iphone.webp', w: 1000, h: 600, body: heicBody(dataUrl) };
}

async function toWebp(pngBuffer, w, h) {
  const dataUrl = 'data:image/png;base64,' + pngBuffer.toString('base64');
  for (const q of [0.9, 0.84, 0.78, 0.72, 0.66, 0.6, 0.55, 0.5]) {
    const b64 = await enc.evaluate(async ({ dataUrl, w, h, q }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      return c.toDataURL('image/webp', q).split(',')[1];
    }, { dataUrl, w, h, q });
    const buf = Buffer.from(b64, 'base64');
    if (buf.byteLength <= MAX_BYTES || q === 0.5) return { buf, q };
  }
}

const allImages = [await buildPhotoImage(), await buildResizeImage(), await buildHeicImage(), ...IMAGES];

for (const img of allImages) {
  const p = await browser.newPage({ viewport: { width: img.w, height: img.h }, deviceScaleFactor: 2 });
  await p.setContent(page(img.body, img.w, img.h), { waitUntil: 'networkidle' });
  const png = await p.screenshot({ clip: { x: 0, y: 0, width: img.w, height: img.h } });
  await p.close();
  const { buf, q } = await toWebp(png, img.w, img.h);
  writeFileSync(path.join(outDir, img.file), buf);
  console.log(`${img.file.padEnd(48)} ${String(img.w)}×${img.h}  q${q}  ${(buf.byteLength / 1024).toFixed(1)} KB`);
}

await browser.close();
console.log(`\ndone → ${path.relative(root, outDir)}/`);
