// Per-route SEO metadata for the (now path-based) landing site.
//
// The site is a single-page app but each route is a real URL (`/features`, `/roadmap`, …) that is
// prerendered to its own static HTML file (see `scripts/prerender.mjs`). Route data (paths, titles,
// descriptions, crumbs) lives in the shared registry `routes.data.js` — imported both here and by
// the prerender script, so there is exactly one route list. This module applies that metadata plus
// the route-level JSON-LD via `setMeta()` on load and on every client navigation — so both crawlers
// (via the prerendered HTML) and users (via the SPA) get correct, unique metadata per page.

import { byId, byPath } from './routes.data.js';
import { LANDING_CONTENT } from './landing/content';

export const SITE = 'https://scalir.org';
export const REPO = 'https://github.com/therealshxd/scalir';

// Route ids are data-defined in routes.data.js (a closed union doesn't scale to the landing-page
// catalogue); integrity is enforced by test/routes.test.ts and the prerender assertions instead.
export type RouteId = string;

// Map a pathname to a route id (unknown paths fall back to home). Tolerates a trailing slash.
export function routeFromPath(pathname: string): RouteId {
  const p = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return byPath[p] ?? 'home';
}

// Whether a pathname is one of our real routes (used to decide whether to intercept a link click).
export function isRoute(pathname: string): boolean {
  const p = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return p in byPath;
}

// SPA navigation to an internal path via the History API. Dispatches a `popstate` so the single
// listener in App.svelte reacts (updating the view, metadata, scroll and analytics) — this lets any
// component (e.g. a "Try Scalir" button) navigate without prop-drilling a handler. No-ops if already
// on that path (so a repeat click doesn't stack history entries).
export function navigate(path: string): void {
  if (typeof window === 'undefined' || path === location.pathname) return;
  history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

// Route-level JSON-LD. Home gets a FAQPage; every sub-page gets a BreadcrumbList, plus a FAQPage
// on the pages that have an on-page FAQ accordion (features/download/self-hosting) — emitted together
// in an @graph. Site-wide schema (WebApplication / Organization / WebSite / SoftwareSourceCode) stays
// static in index.html. FAQ questions/answers come from FAQ_BY_ROUTE below, the SAME data the pages
// render, so the structured data always matches the visible accordion text (a compliance requirement).
function breadcrumbLd(id: RouteId): object {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: byId[id].crumb, item: SITE + byId[id].path },
    ],
  };
}

function faqPageLd(items: Faq[]): object {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function routeJsonLd(id: RouteId): object {
  const graph: object[] = [];
  if (id !== 'home') graph.push(breadcrumbLd(id));
  // Bespoke pages keep their FAQ arrays below; landing pages carry theirs in LANDING_CONTENT.
  const faq = FAQ_BY_ROUTE[id] ?? LANDING_CONTENT[id]?.faq;
  if (faq) graph.push(faqPageLd(faq));
  // A single node is emitted flat (with @context); multiple nodes go in an @graph.
  return graph.length === 1
    ? { '@context': 'https://schema.org', ...graph[0] }
    : { '@context': 'https://schema.org', '@graph': graph };
}

// Apply all head metadata for a route. Idempotent — safe to call on every navigation.
export function setMeta(id: RouteId): void {
  if (typeof document === 'undefined') return;
  const m = byId[id];
  const url = SITE + m.path;
  document.title = m.title;
  upsertMeta('name', 'description', m.description);
  upsertLink('canonical', url);
  upsertMeta('property', 'og:title', m.title);
  upsertMeta('property', 'og:description', m.description);
  upsertMeta('property', 'og:url', url);
  upsertMeta('name', 'twitter:title', m.title);
  upsertMeta('name', 'twitter:description', m.description);

  let ld = document.getElementById('ld-route') as HTMLScriptElement | null;
  if (!ld) {
    ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id = 'ld-route';
    document.head.appendChild(ld);
  }
  ld.textContent = JSON.stringify(routeJsonLd(id));
}

// ── FAQ content (single source of truth) ──────────────────────────────────────────────────────
// Each page renders these <details> accordions AND they feed the FAQPage JSON-LD above, so the two
// can never drift. `a` is the plain-text answer (used verbatim in the structured data); an optional
// `href`/`linkText` adds a trailing internal link on the page only (schema uses `a` alone).
export type Faq = { q: string; a: string; href?: string; linkText?: string };

export const HOME_FAQ: Faq[] = [
  {
    q: 'Is Scalir free?',
    a: 'Yes — Scalir is completely free and open source under the MIT license. There are no accounts, no watermarks and no paid tier. Self-host it for unlimited use.',
  },
  {
    q: 'How do I compress images online for free?',
    a: "Drop your images onto Scalir, pick a preset and hit Optimise. It's a free image compressor that runs in your browser, so there's nothing to install, no sign-up and nothing to pay for.",
  },
  {
    q: 'Are my images uploaded to a server?',
    a: 'No. Every image is compressed, resized and converted entirely in your browser, on your own device. Nothing is ever uploaded, so your images stay completely private.',
  },
  {
    q: 'Can I compress images without uploading them?',
    a: 'Yes. Scalir is a private image compressor — every file is processed on your own device and nothing is ever uploaded, so you can compress images without uploading them anywhere.',
  },
  {
    q: 'What image formats can I compress?',
    a: 'You can bring in JPG, PNG, WebP, AVIF, HEIC/HEIF, GIF, TIFF and BMP, and export to JPEG, PNG, WebP or AVIF — automatically or forced to a format you choose.',
  },
  {
    q: 'Can I compress images in bulk?',
    a: 'Yes. Scalir is built for bulk image compression — drop in a whole folder and it processes everything in parallel across your CPU cores, then hands back a ZIP or saves to a folder.',
  },
  {
    q: 'How much can I reduce image file size?',
    a: 'Presets range from around 40% to 85% smaller. You can also shrink image size to a specific target file size — for example under 1 MB — while keeping quality high.',
  },
  {
    q: 'Does it work offline?',
    a: 'Yes. Scalir is an installable PWA and has a desktop app for Windows and Linux. After the first load it works fully offline.',
  },
  {
    q: 'Is there a file-size or image limit?',
    a: 'The hosted app has a small soft per-session limit as a gentle nudge. The self-hosted and desktop builds are completely unlimited.',
  },
];

export const FEATURES_FAQ: Faq[] = [
  {
    q: 'How do I resize images online without losing quality?',
    a: 'Use Scalir as a bulk image resizer: add your photos, choose a target width or cap the longest side, and it downscales with high-quality Lanczos3 resampling. Because it only ever shrinks and always keeps the aspect ratio, you resize images without losing quality you can see.',
  },
  {
    q: 'How do I compress an image to a specific size?',
    a: 'Set a maximum file size and Scalir runs a quality binary-search to compress the image to that specific size — for example to compress an image under 1 MB — landing the best-looking result that still fits your budget.',
  },
  {
    q: 'How do I convert HEIC to JPG?',
    a: 'Drop your iPhone HEIC photos onto Scalir and set the output format to JPEG (or WebP). It decodes HEIC/HEIF on your device and re-exports web-ready files, so you can convert HEIC to JPG in seconds with no app to install.',
  },
  {
    q: "What's the difference between WebP and AVIF?",
    a: 'Both are modern formats that beat JPEG and PNG on size. WebP is smaller than JPEG with near-universal browser support, while AVIF compresses even further for the smallest files at similar quality, with slightly slower encoding. Scalir can convert to either — use WebP for broad compatibility and AVIF when you want the absolute smallest file.',
  },
];

export const DOWNLOAD_FAQ: Faq[] = [
  {
    q: 'Is there an offline image compressor for Windows?',
    a: 'Yes. The Scalir desktop app is a fully offline image compressor for Windows 10 and 11 — install it once and compress, resize and convert images with no internet connection and nothing ever leaving your machine.',
  },
  {
    q: 'Does the desktop app work without internet?',
    a: 'It does. After installation the desktop image compressor runs completely offline: all decoding, resizing and compression happens locally on your device, so it works on a plane, an air-gapped machine or anywhere with no connection.',
  },
  {
    q: 'Is there a Mac version?',
    a: 'There is no separate macOS desktop build yet, but the free in-browser version runs the full tool on macOS in any modern browser — nothing to install, and it stays just as private.',
    href: '/',
    linkText: 'Open the free web version',
  },
];

export const SELF_HOSTING_FAQ: Faq[] = [
  {
    q: 'How do I run a self-hosted image compressor with Docker?',
    a: 'Clone the repo and run docker compose up -d, or build the image straight from the Dockerfile. In a couple of minutes you have a self-hosted image compressor served by Nginx on your own server, with no accounts and no per-image limits.',
  },
  {
    q: 'Is the self-hosted version unlimited?',
    a: 'Yes. Unlike the hosted site, the self-hosted image optimiser has no soft per-session limit — process as many images as you like, as often as you like, entirely behind your own firewall.',
  },
  {
    q: 'Can I use it as a docker image compressor in my own pipeline?',
    a: 'Absolutely. Because it ships as a Docker image compressor you can run it on your own infrastructure behind a reverse proxy, or as an internal service your team points at — private, unlimited and with no external dependencies.',
  },
];

// Which routes render an on-page FAQ (and therefore emit FAQPage JSON-LD).
const FAQ_BY_ROUTE: Partial<Record<RouteId, Faq[]>> = {
  home: HOME_FAQ,
  features: FEATURES_FAQ,
  download: DOWNLOAD_FAQ,
  'self-hosting': SELF_HOSTING_FAQ,
};
