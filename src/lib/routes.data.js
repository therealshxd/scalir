// The single shared route registry for the landing site. Pure data with zero imports so BOTH
// worlds can use it: the Vite app (src/lib/seo.ts, Footer, ToolLanding) and the plain-Node
// prerender script (scripts/prerender.mjs), which also generates sitemap.xml and llms.txt from
// this list. Adding a page = adding an entry here (+ its copy in src/lib/landing/content.ts for
// `kind: 'landing'` routes) — nothing else needs a route list.
//
// Types for TS consumers live in routes.data.d.ts (hand-written, kept in sync with the
// @typedef below).
//
// Order matters: home first (sitemap order). Keep titles ≤ 65 chars; descriptions ≤ 160 for
// landing pages (test/routes.test.ts enforces both).

/**
 * @typedef {Object} RouteEntry
 * @property {string} id            unique route id, e.g. 'convert-heic-to-jpg'
 * @property {string} path          real pathname, leading slash, no trailing slash
 * @property {string} title         <title> + og:title/twitter:title
 * @property {string} description   meta description + og/twitter description
 * @property {string} crumb         BreadcrumbList label for sub-pages
 * @property {'product'|'convert'|'compress'|'resize'|'compare'|'legal'} group  footer column
 * @property {'bespoke'|'landing'} kind  bespoke = hand-written component; landing = ToolLanding
 * @property {1|2|3} [tier]         rollout batch for landing pages; drives sitemap priority
 * @property {string} [llms]        one-line llms.txt blurb (falls back to description)
 */

/** @type {RouteEntry[]} */
export const ROUTE_LIST = [
  // ── Bespoke product pages ─────────────────────────────────────────────────────────────────
  {
    id: 'home',
    path: '/',
    title: 'Scalir — Free Bulk Image Compressor (Private, In-Browser)',
    description:
      'Free bulk image compressor — compress, resize and convert images online in your browser. JPG, PNG, WebP, AVIF, HEIC, GIF, TIFF, BMP. No uploads, no sign-up, completely private.',
    crumb: 'Home',
    group: 'product',
    kind: 'bespoke',
    llms: 'The bulk image compressor tool and overview.',
  },
  {
    id: 'features',
    path: '/features',
    title: 'Features — Bulk Compression, Resize & Convert | Scalir',
    description:
      'Everything Scalir does: bulk image compression, Lanczos3 resizing, target-size compression, before/after preview, WebP & AVIF conversion, and HEIC/TIFF support — free and 100% in your browser.',
    crumb: 'Features',
    group: 'product',
    kind: 'bespoke',
    llms: 'Full feature breakdown — bulk compression, resizing, formats, before/after preview, privacy.',
  },
  {
    id: 'roadmap',
    path: '/roadmap',
    title: "Roadmap — What's Shipped & Next | Scalir",
    description:
      'See what has shipped and what is planned for Scalir, the free, private, in-browser image optimiser — resize modes, before/after preview, PDF compression and more.',
    crumb: 'Roadmap',
    group: 'product',
    kind: 'bespoke',
    llms: 'What has shipped and what is planned next.',
  },
  {
    id: 'self-hosting',
    path: '/self-hosting',
    title: 'Self-Host Scalir with Docker — Private Image Optimiser',
    description:
      'Run Scalir on your own server with Docker in minutes. Unlimited, private bulk image compression behind your firewall — no uploads, no accounts, no external dependencies.',
    crumb: 'Self-hosting',
    group: 'product',
    kind: 'bespoke',
    llms: 'Run Scalir with Docker on your own server, unlimited and private.',
  },
  {
    id: 'download',
    path: '/download',
    title: 'Download Scalir — Desktop Image Compressor (Windows & Linux)',
    description:
      'Install the free Scalir desktop app for Windows and Linux, or run it with Docker. Fast, offline, private bulk image compression on your own machine.',
    crumb: 'Download',
    group: 'product',
    kind: 'bespoke',
    llms: 'Free desktop apps for Windows and Linux.',
  },
  {
    id: 'about',
    path: '/about',
    title: 'About Scalir — Free, Private, Open-Source Image Optimiser',
    description:
      'Scalir is a free, open-source, privacy-first image optimiser that runs entirely in your browser. Learn what it is, how it works and who built it.',
    crumb: 'About',
    group: 'product',
    kind: 'bespoke',
    llms: 'What Scalir is, how it works, and who built it.',
  },
  {
    id: 'privacy',
    path: '/privacy',
    title: 'Privacy Policy — Scalir',
    description:
      "Scalir's privacy policy: your images never leave your device, no accounts, and cookieless analytics on the public site only. Privacy by design.",
    crumb: 'Privacy',
    group: 'legal',
    kind: 'bespoke',
    llms: 'Privacy policy — nothing ever leaves your device.',
  },

  // ── Landing pages: convert (tier 1) ───────────────────────────────────────────────────────
  {
    id: 'convert-heic-to-jpg',
    path: '/convert/heic-to-jpg',
    title: 'HEIC to JPG Converter — Free, Private, Works Offline | Scalir',
    description:
      'Turn iPhone HEIC photos into universally compatible JPGs on your own device. Batch-convert a whole camera roll in seconds — nothing is ever uploaded.',
    crumb: 'HEIC to JPG',
    group: 'convert',
    kind: 'landing',
    tier: 1,
    llms: 'Convert iPhone HEIC/HEIF photos to JPG, in bulk, without uploads.',
  },
  {
    id: 'convert-webp-to-jpg',
    path: '/convert/webp-to-jpg',
    title: 'WebP to JPG Converter — Open WebP Images Anywhere | Scalir',
    description:
      "Saved a WebP that Photoshop or an upload form won't take? Convert WebP to JPG in your browser — free, instant and private, with whole-folder batches.",
    crumb: 'WebP to JPG',
    group: 'convert',
    kind: 'landing',
    tier: 1,
    llms: 'Convert WebP images to universally compatible JPG, in bulk.',
  },
  {
    id: 'convert-webp-to-png',
    path: '/convert/webp-to-png',
    title: 'WebP to PNG Converter — Lossless, Keeps Transparency | Scalir',
    description:
      'Convert WebP images to pixel-perfect PNG with alpha transparency intact — ideal for editors, decks and app-store assets. Runs entirely on your device.',
    crumb: 'WebP to PNG',
    group: 'convert',
    kind: 'landing',
    tier: 1,
    llms: 'Convert WebP images to lossless PNG with transparency preserved.',
  },
  {
    id: 'convert-png-to-webp',
    path: '/convert/png-to-webp',
    title: 'PNG to WebP Converter — Cut Image Weight up to 90% | Scalir',
    description:
      'Shrink heavy PNGs into WebP for faster pages and better Core Web Vitals, transparency included. Batch-convert an entire asset folder in one drag-and-drop.',
    crumb: 'PNG to WebP',
    group: 'convert',
    kind: 'landing',
    tier: 1,
    llms: 'Convert PNG images to WebP for faster pages, transparency kept.',
  },
  {
    id: 'convert-jpg-to-webp',
    path: '/convert/jpg-to-webp',
    title: 'JPG to WebP Converter — Smaller Photos, Same Quality | Scalir',
    description:
      'Re-encode JPG photos as WebP and save roughly a third of every file with no visible difference. In-browser batch conversion for galleries and websites.',
    crumb: 'JPG to WebP',
    group: 'convert',
    kind: 'landing',
    tier: 1,
    llms: 'Convert JPG photos to smaller WebP files at the same visual quality.',
  },

  // ── Landing pages: compress (tier 1) ──────────────────────────────────────────────────────
  {
    id: 'compress-jpeg',
    path: '/compress-jpeg',
    title: 'JPEG Compressor — Shrink JPGs to an Exact File Size | Scalir',
    description:
      'Reduce JPEG file size to any target — 500KB, 1MB, you choose — while a smart quality search keeps photos looking sharp. Compress hundreds at once, locally.',
    crumb: 'Compress JPEG',
    group: 'compress',
    kind: 'landing',
    tier: 1,
    llms: 'Compress JPEG images to a target size with no visible quality loss.',
  },
  {
    id: 'compress-png',
    path: '/compress-png',
    title: 'PNG Compressor — Smaller PNGs, Zero Quality Loss | Scalir',
    description:
      'Make PNG files smaller three ways: lossless re-encoding, smarter dimensions, or WebP conversion with transparency kept. All in your browser, no uploads.',
    crumb: 'Compress PNG',
    group: 'compress',
    kind: 'landing',
    tier: 1,
    llms: 'Compress PNG images losslessly, or convert to WebP for bigger savings.',
  },
  {
    id: 'compress-image-to-100kb',
    path: '/compress-image-to-100kb',
    title: 'Compress Image to 100KB — Fit Any Upload Limit | Scalir',
    description:
      'Get any photo under 100KB — or 50KB, or 200KB — for job portals, visa forms and avatars. Set the limit and the best-looking result that fits comes back.',
    crumb: 'Compress to 100KB',
    group: 'compress',
    kind: 'landing',
    tier: 1,
    llms: 'Compress any image to 100KB (or another exact limit) for upload forms.',
  },
];

/** @type {Record<string, RouteEntry>} */
export const byId = Object.fromEntries(ROUTE_LIST.map((r) => [r.id, r]));

/** @type {Record<string, string>} path → route id */
export const byPath = Object.fromEntries(ROUTE_LIST.map((r) => [r.path, r.id]));
