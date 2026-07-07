// Per-route SEO metadata for the (now path-based) landing site.
//
// The site is a single-page app but each route is a real URL (`/features`, `/roadmap`, …) that is
// prerendered to its own static HTML file (see `scripts/prerender.mjs`). This module is the single
// source of truth for each route's <title>/description/canonical/OG tags and its route-level JSON-LD,
// applied by `setMeta()` on load and on every client navigation — so both crawlers (via the
// prerendered HTML) and users (via the SPA) get correct, unique metadata per page.

export const SITE = 'https://scalir.org';
export const REPO = 'https://github.com/therealshxd/scalir';

export type RouteId = 'home' | 'features' | 'roadmap' | 'self-hosting' | 'download' | 'about' | 'privacy';

interface RouteMeta {
  path: string;          // real pathname, e.g. '/features'
  title: string;         // <title> + og:title/twitter:title
  description: string;   // meta description + og/twitter description
  crumb: string;         // BreadcrumbList label for sub-pages
}

// Order matters for the sitemap (home first). Keep titles ≤ ~60 chars and descriptions ≤ ~155.
export const ROUTES: Record<RouteId, RouteMeta> = {
  home: {
    path: '/',
    title: 'Scalir — Free Bulk Image Compressor (Private, In-Browser)',
    description:
      'Free bulk image compressor — compress, resize and convert images online in your browser. JPG, PNG, WebP, AVIF, HEIC, GIF, TIFF, BMP. No uploads, no sign-up, completely private.',
    crumb: 'Home',
  },
  features: {
    path: '/features',
    title: 'Features — Bulk Compression, Resize & Convert | Scalir',
    description:
      'Everything Scalir does: bulk image compression, Lanczos3 resizing, target-size compression, before/after preview, WebP & AVIF conversion, and HEIC/TIFF support — free and 100% in your browser.',
    crumb: 'Features',
  },
  roadmap: {
    path: '/roadmap',
    title: "Roadmap — What's Shipped & Next | Scalir",
    description:
      'See what has shipped and what is planned for Scalir, the free, private, in-browser image optimiser — resize modes, before/after preview, PDF compression and more.',
    crumb: 'Roadmap',
  },
  'self-hosting': {
    path: '/self-hosting',
    title: 'Self-Host Scalir with Docker — Private Image Optimiser',
    description:
      'Run Scalir on your own server with Docker in minutes. Unlimited, private bulk image compression behind your firewall — no uploads, no accounts, no external dependencies.',
    crumb: 'Self-hosting',
  },
  download: {
    path: '/download',
    title: 'Download Scalir — Desktop Image Compressor (Windows & Linux)',
    description:
      'Install the free Scalir desktop app for Windows and Linux, or run it with Docker. Fast, offline, private bulk image compression on your own machine.',
    crumb: 'Download',
  },
  about: {
    path: '/about',
    title: 'About Scalir — Free, Private, Open-Source Image Optimiser',
    description:
      'Scalir is a free, open-source, privacy-first image optimiser that runs entirely in your browser. Learn what it is, how it works and who built it.',
    crumb: 'About',
  },
  privacy: {
    path: '/privacy',
    title: 'Privacy Policy — Scalir',
    description:
      "Scalir's privacy policy: your images never leave your device, no accounts, and cookieless analytics on the public site only. Privacy by design.",
    crumb: 'Privacy',
  },
};

const BY_PATH: Record<string, RouteId> = Object.fromEntries(
  (Object.keys(ROUTES) as RouteId[]).map((id) => [ROUTES[id].path, id]),
);

// Map a pathname to a route id (unknown paths fall back to home). Tolerates a trailing slash.
export function routeFromPath(pathname: string): RouteId {
  const p = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return BY_PATH[p] ?? 'home';
}

// Whether a pathname is one of our real routes (used to decide whether to intercept a link click).
export function isRoute(pathname: string): boolean {
  const p = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return p in BY_PATH;
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

// Route-level JSON-LD: FAQPage on home, a BreadcrumbList on every sub-page. Site-wide schema
// (WebApplication / Organization / WebSite / SoftwareSourceCode) stays static in index.html.
function routeJsonLd(id: RouteId): object {
  if (id === 'home') return FAQ_LD;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: ROUTES[id].crumb, item: SITE + ROUTES[id].path },
    ],
  };
}

// Apply all head metadata for a route. Idempotent — safe to call on every navigation.
export function setMeta(id: RouteId): void {
  if (typeof document === 'undefined') return;
  const m = ROUTES[id];
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

// Home FAQ — kept here (rather than inline in index.html) so it's injected only on the home route.
const FAQ_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is Scalir free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — Scalir is completely free and open source under the MIT license. There are no accounts, no watermarks and no paid tier. Self-host it for unlimited use.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are my images uploaded to a server?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Every image is compressed, resized and converted entirely in your browser, on your own device. Nothing is ever uploaded, so your images stay completely private.',
      },
    },
    {
      '@type': 'Question',
      name: 'What image formats can I compress?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can bring in JPG, PNG, WebP, AVIF, HEIC/HEIF, GIF, TIFF and BMP, and export to JPEG, PNG, WebP or AVIF — automatically or forced to a format you choose.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I compress images in bulk?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Scalir is built for bulk image compression — drop in a whole folder and it processes everything in parallel across your CPU cores, then hands back a ZIP or saves to a folder.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it work offline?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Scalir is an installable PWA and has a desktop app for Windows and Linux. After the first load it works fully offline.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a file-size or image limit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The hosted app has a small soft per-session limit as a gentle nudge. The self-hosted and desktop builds are completely unlimited.',
      },
    },
  ],
};
