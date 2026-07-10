// Static prerender for SEO. Serves the built `dist/` with vite preview (which has SPA fallback),
// loads each route in a headless browser so the app renders + sets its per-route <head> metadata
// (see src/lib/seo.ts setMeta), then writes the fully-rendered HTML to dist/<route>/index.html.
// The route list comes from src/lib/routes.data.js — the same registry the app itself uses — so
// there is exactly one list to maintain. Each page is also smoke-checked (title, h1, canonical,
// and for landing pages the embedded preconfigured tool); any mismatch fails the build, which
// makes every `npm run build:seo` an end-to-end test. Also emits sitemap.xml and llms.txt.
// Run via `npm run build:seo` (build → prerender).
import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTE_LIST } from '../src/lib/routes.data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://scalir.org';

const server = await preview({ root, preview: { port: 4319, strictPort: true } });
const origin = server.resolvedUrls?.local?.[0]?.replace(/\/$/, '') ?? 'http://localhost:4319';
const browser = await chromium.launch();
const page = await browser.newPage();

let exitCode = 0;

// Sitemap priority: home tops the list; tier-1 landing pages rank with the product pages,
// later tiers and legal pages sit lower.
function priorityOf(r) {
  if (r.id === 'home') return '1.0';
  if (r.group === 'legal') return '0.6';
  if (r.kind === 'landing') return { 1: '0.8', 2: '0.7', 3: '0.6' }[r.tier] ?? '0.6';
  return '0.8';
}

try {
  for (const r of ROUTE_LIST) {
    const route = r.path;
    await page.goto(origin + route, { waitUntil: 'networkidle' });
    await page.waitForFunction(
      () => !!document.querySelector('#app')?.children.length && !!document.title,
      null,
      { timeout: 15000 },
    );
    await page.waitForTimeout(120); // let setMeta finish

    // Smoke-check the rendered page against the registry — a failed expectation fails the build.
    const check = await page.evaluate(() => ({
      title: document.title,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
      hasH1: !!document.querySelector('h1'),
      hasTool: !!document.querySelector('#tool'),
      presetFormat: document.querySelector('[data-preset-format]')?.getAttribute('data-preset-format') ?? null,
      selectedFormat: document.querySelector('select[data-setting="output-format"]')?.value ?? null,
    }));
    const fail = (msg) => {
      throw new Error(`prerender check failed for ${route}: ${msg}`);
    };
    if (check.title !== r.title) fail(`title "${check.title}" ≠ registry "${r.title}"`);
    if (check.canonical !== SITE + route) fail(`canonical "${check.canonical}" ≠ "${SITE + route}"`);
    if (!check.hasH1) fail('no <h1> rendered');
    if (r.kind === 'landing') {
      if (!check.hasTool) fail('embedded #tool missing');
      if (check.presetFormat && check.presetFormat !== check.selectedFormat) {
        fail(`tool format "${check.selectedFormat}" ≠ preset "${check.presetFormat}"`);
      }
    }

    const html = '<!doctype html>\n' + (await page.evaluate(() => document.documentElement.outerHTML));
    const dir = route === '/' ? path.join(root, 'dist') : path.join(root, 'dist', route.slice(1));
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'index.html'), html);
    console.log(`prerendered ${route.padEnd(26)} → ${path.relative(root, path.join(dir, 'index.html')).padEnd(40)} · "${check.title}"`);
  }

  // Emit sitemap.xml into dist (served) and public (committed source of truth).
  const today = new Date().toISOString().slice(0, 10);
  const body = ROUTE_LIST.map((r) => {
    const loc = SITE + (r.path === '/' ? '/' : r.path);
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.path === '/' ? 'weekly' : 'monthly'}</changefreq>\n    <priority>${priorityOf(r)}</priority>\n  </url>`;
  }).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  writeFileSync(path.join(root, 'dist', 'sitemap.xml'), sitemap);
  writeFileSync(path.join(root, 'public', 'sitemap.xml'), sitemap);
  console.log(`sitemap.xml → ${ROUTE_LIST.length} urls`);

  // Emit llms.txt (same two destinations). The preamble is static; the Pages list is generated
  // from the registry so it can never drift from the real site.
  const pagesList = ROUTE_LIST.map(
    (r) => `- [${r.crumb === 'Home' ? 'Home' : r.crumb}](${SITE}${r.path === '/' ? '/' : r.path}): ${r.llms ?? r.description}`,
  ).join('\n');
  const llms = `# Scalir

> Scalir is a free, private, open-source bulk image compressor that runs entirely in your web browser. Compress, resize and convert images (JPG, PNG, WebP, AVIF, HEIC, GIF, TIFF, BMP) with no uploads, no accounts and no server — every image is processed on your own device.

Scalir is built for people who need to optimise many images at once without handing them to a cloud service. It runs the same WebAssembly codecs as Squoosh (MozJPEG, libwebp, libavif, libpng) locally, across all CPU cores. It also ships as an installable PWA and as native desktop apps for Windows and Linux, and can be self-hosted with Docker for unlimited internal use.

Key facts:
- Free and open source (MIT license). No accounts, watermarks or paid tier.
- 100% client-side: images are never uploaded; EXIF/GPS metadata is stripped on export.
- Input formats: JPG, PNG, WebP, AVIF, HEIC/HEIF, GIF, TIFF, BMP. Output: JPEG, PNG, WebP, AVIF (auto or forced).
- Bulk compression in parallel across CPU cores, high-quality Lanczos3 resizing, target-size compression, before/after preview with per-image quality, and smart output naming.
- Works offline after first load; self-hostable via Docker.

## Pages
${pagesList}

## Source
- [GitHub repository](https://github.com/therealshxd/scalir): Source code (TypeScript, Svelte, Rust/Tauri), MIT licensed.
`;
  writeFileSync(path.join(root, 'dist', 'llms.txt'), llms);
  writeFileSync(path.join(root, 'public', 'llms.txt'), llms);
  console.log(`llms.txt → ${ROUTE_LIST.length} pages`);
} catch (err) {
  console.error(err);
  exitCode = 1;
} finally {
  await browser.close();
  await server.httpServer?.close?.();
  // vite preview keeps the event loop alive; exit explicitly once done — with a non-zero code
  // when any smoke-check failed, so CI/builds go red instead of shipping a broken page.
  process.exit(exitCode);
}
