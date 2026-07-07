// Privacy-respecting analytics via self-hosted Umami.
//
// The script is loaded ONLY on the public hosted domains listed below. The Tauri desktop
// app (hostname `tauri.localhost`), local dev (`localhost`) and any self-hosted copy are
// not in the map, so they inject nothing and send nothing — this hostname allowlist is the
// single control point for whether a visitor is tracked at all. `data-do-not-track` makes
// Umami additionally honour the browser's Do Not Track signal. Umami is cookieless and
// stores no personal data.
//
// Scalir is a hash-router SPA (routes are `#/features`, `#/roadmap`, …). Umami's automatic
// tracking only records the initial page load and History-API navigations — it never sees a
// `hashchange` — so it would report every visit as just `/` or `/#/`. We therefore turn its
// auto-tracking OFF (`data-auto-track="false"`) and drive pageviews ourselves via
// `trackPageview()`, normalising each route to a clean pathname (`#/features` → `/features`).

const SITE_IDS: Record<string, string> = {
  'scalir.org': 'ef1fc97f-3c1a-439f-9a0f-adf3d815a501',
  'scalir.shad.digital': 'a6f49f8e-14ea-4aeb-b759-0e4a1f08bea3',
};
const SRC = 'https://analytics.scalir.org/script.js';

type TrackArg =
  | string
  | ((props: Record<string, unknown>) => Record<string, unknown>);
type Umami = { track?: (a: TrackArg, d?: Record<string, unknown>) => void };
const umami = (): Umami | undefined =>
  (window as unknown as { umami?: Umami }).umami;

// Normalise the current hash route to a clean pathname so Umami's Pages report groups sensibly:
// `#/features` → `/features`, `#/self-hosting` → `/self-hosting`, `#/` or no hash → `/`.
function routePath(): string {
  const seg = (location.hash || '').replace(/^#\/?/, '').split(/[/?#]/)[0];
  return '/' + seg;
}

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
  // We own pageviews (hash routing) — disable Umami's auto-tracking and record the first view
  // once the script is ready. Subsequent views are fired from the router on `hashchange`.
  s.setAttribute('data-auto-track', 'false');
  s.addEventListener('load', trackPageview);
  document.head.appendChild(s);
}

// Record a pageview for the current route. Safe no-op wherever Umami wasn't injected or before
// the script has loaded; never allowed to throw.
export function trackPageview(): void {
  try {
    umami()?.track?.((props) => ({ ...props, url: routePath() }));
  } catch {
    /* ignore */
  }
}

// Fire a custom event. A no-op wherever Umami wasn't injected, and never allowed to throw —
// analytics must not be able to break the app.
export function track(event: string, data?: Record<string, unknown>): void {
  try {
    umami()?.track?.(event, data);
  } catch {
    /* ignore */
  }
}

// Delegated click tracking. Any element (or ancestor) carrying `data-track="event-name"` fires
// that event when clicked, with an optional `data-track-value` sent as its `value` property.
// This lets us tag buttons/links declaratively (`<button data-track="cta" data-track-value="…">`)
// without wiring an onclick to each — replacing Umami's own click delegation, which is off with
// auto-tracking disabled. Returns a cleanup function.
export function initClickTracking(): () => void {
  if (typeof window === 'undefined') return () => {};
  const onClick = (e: MouseEvent) => {
    const el = (e.target as Element | null)?.closest?.('[data-track]') as HTMLElement | null;
    const name = el?.dataset.track;
    if (!name) return;
    const value = el!.dataset.trackValue;
    track(name, value ? { value } : undefined);
  };
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
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
