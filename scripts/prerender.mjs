// Static prerender for SEO. Serves the built `dist/` with vite preview (which has SPA fallback),
// loads each route in a headless browser so the app renders + sets its per-route <head> metadata
// (see src/lib/seo.ts setMeta), then writes the fully-rendered HTML to dist/<route>/index.html.
// Also emits sitemap.xml. Run via `npm run build:seo` (build → prerender). Crawlers/agents get
// complete per-page HTML; users still boot the SPA (main.ts clears #app and re-mounts).
import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://scalir.org';

// Keep in sync with the ROUTES paths in src/lib/seo.ts.
const ROUTES = ['/', '/features', '/roadmap', '/self-hosting', '/download', '/about', '/privacy'];

const server = await preview({ root, preview: { port: 4319, strictPort: true } });
const origin = server.resolvedUrls?.local?.[0]?.replace(/\/$/, '') ?? 'http://localhost:4319';
const browser = await chromium.launch();
const page = await browser.newPage();

try {
  for (const route of ROUTES) {
    await page.goto(origin + route, { waitUntil: 'networkidle' });
    await page.waitForFunction(
      () => !!document.querySelector('#app')?.children.length && !!document.title,
      null,
      { timeout: 15000 },
    );
    await page.waitForTimeout(120); // let setMeta finish
    const html = '<!doctype html>\n' + (await page.evaluate(() => document.documentElement.outerHTML));
    const dir = route === '/' ? path.join(root, 'dist') : path.join(root, 'dist', route.slice(1));
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'index.html'), html);
    const title = await page.title();
    console.log(`prerendered ${route.padEnd(14)} → ${path.relative(root, path.join(dir, 'index.html')).padEnd(28)} · "${title}"`);
  }

  // Emit sitemap.xml into dist (served) and public (committed source of truth).
  const today = new Date().toISOString().slice(0, 10);
  const body = ROUTES.map((r) => {
    const loc = SITE + (r === '/' ? '/' : r);
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r === '/' ? 'weekly' : 'monthly'}</changefreq>\n    <priority>${r === '/' ? '1.0' : '0.8'}</priority>\n  </url>`;
  }).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  writeFileSync(path.join(root, 'dist', 'sitemap.xml'), sitemap);
  writeFileSync(path.join(root, 'public', 'sitemap.xml'), sitemap);
  console.log(`sitemap.xml → ${ROUTES.length} urls`);
} finally {
  await browser.close();
  await server.httpServer?.close?.();
  // vite preview keeps the event loop alive; exit explicitly once done.
  process.exit(0);
}
