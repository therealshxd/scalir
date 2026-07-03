// Privacy-respecting analytics via self-hosted Umami.
//
// The script is loaded ONLY on the public hosted domains listed below. The Tauri desktop
// app (hostname `tauri.localhost`), local dev (`localhost`) and any self-hosted copy are
// not in the map, so they inject nothing and send nothing — this hostname allowlist is the
// single control point for whether a visitor is tracked at all. `data-do-not-track` makes
// Umami additionally honour the browser's Do Not Track signal. Umami is cookieless and
// stores no personal data.

const SITE_IDS: Record<string, string> = {
  'scalir.org': 'ef1fc97f-3c1a-439f-9a0f-adf3d815a501',
  'scalir.shad.digital': 'a6f49f8e-14ea-4aeb-b759-0e4a1f08bea3',
};
const SRC = 'https://analytics.scalir.org/script.js';

export function initAnalytics(): void {
  if (typeof window === 'undefined') return;
  const id = SITE_IDS[location.hostname];
  if (!id) return; // desktop app, self-host, localhost → no tracking
  if (document.querySelector('script[data-website-id]')) return; // already injected
  const s = document.createElement('script');
  s.defer = true;
  s.src = SRC;
  s.setAttribute('data-website-id', id);
  s.setAttribute('data-do-not-track', 'true');
  document.head.appendChild(s);
}

// Fire a custom event. A no-op wherever Umami wasn't injected, and never allowed to throw —
// analytics must not be able to break the app.
export function track(event: string, data?: Record<string, unknown>): void {
  try {
    (window as unknown as { umami?: { track?: (e: string, d?: Record<string, unknown>) => void } })
      .umami?.track?.(event, data);
  } catch {
    /* ignore */
  }
}

// Umami has no native scroll tracking, so record depth milestones ourselves. Each of 25/50/75/100%
// fires once per page load. Returns a cleanup function that removes the listener.
export function initScrollDepth(): () => void {
  if (typeof window === 'undefined') return () => {};
  const marks = [25, 50, 75, 100];
  const seen = new Set<number>();
  const onScroll = () => {
    const el = document.documentElement;
    const scrollable = el.scrollHeight - el.clientHeight;
    if (scrollable <= 0) return;
    const pct = (el.scrollTop / scrollable) * 100;
    for (const m of marks) {
      if (pct >= m && !seen.has(m)) {
        seen.add(m);
        track('scroll-depth', { percent: m });
      }
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}
