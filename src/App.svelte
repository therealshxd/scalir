<script lang="ts">
  import { onMount } from 'svelte';
  import Home from './lib/Home.svelte';
  import SelfHosting from './lib/SelfHosting.svelte';
  import Download from './lib/Download.svelte';
  import Roadmap from './lib/Roadmap.svelte';
  import Features from './lib/Features.svelte';
  import About from './lib/About.svelte';
  import PrivacyPolicy from './lib/PrivacyPolicy.svelte';
  import { initScrollDepth, initClickTracking, trackPageview } from './lib/analytics';
  import { routeFromPath, isRoute, setMeta, navigate } from './lib/seo';

  const base = import.meta.env.BASE_URL;

  let route = $state(routeFromPath(location.pathname));

  onMount(() => {
    // Back-compat: rewrite any legacy hash URL (e.g. #/features) to its real path so old links,
    // bookmarks and shares still resolve after the move to path-based routing.
    const legacy = location.hash.replace(/^#\/?/, '');
    if (legacy) {
      history.replaceState({}, '', '/' + legacy);
      route = routeFromPath(location.pathname);
    }
    setMeta(route);

    const onPop = () => {
      route = routeFromPath(location.pathname);
      setMeta(route);
      window.scrollTo({ top: 0 });
      trackPageview();
    };
    window.addEventListener('popstate', onPop);

    // Intercept plain left-clicks on internal route links → SPA navigation (no full reload).
    // Skips modified clicks, new-tab/download links, external links and non-route paths.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href) return;
      const url = new URL(href, location.href);
      if (url.origin !== location.origin || !isRoute(url.pathname)) return;
      e.preventDefault();
      navigate(url.pathname);
    };
    document.addEventListener('click', onClick);

    const stopScroll = initScrollDepth();
    const stopClicks = initClickTracking();
    return () => {
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('click', onClick);
      stopScroll();
      stopClicks();
    };
  });

  function gotoTool(e: Event) {
    e.preventDefault();
    navigate('/');
    setTimeout(() => document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' }), 60);
  }
</script>

<nav class="nav">
  <div class="nav-inner">
    <a class="brand" href="/"><img src={base + 'pwa-192.png'} alt="" width="26" height="26" /> Scalir</a>
    <div class="links">
      <a href="/" onclick={gotoTool}>Try Scalir</a>
      <a href="/features">Features</a>
      <a href="/roadmap">Roadmap</a>
      <a href="/self-hosting">Self-hosting</a>
      <a href="/download">Download</a>
      <a href="/about">About</a>
    </div>
  </div>
</nav>

<main>
  {#if route === 'self-hosting'}
    <SelfHosting />
  {:else if route === 'download'}
    <Download />
  {:else if route === 'roadmap'}
    <Roadmap />
  {:else if route === 'features'}
    <Features />
  {:else if route === 'about'}
    <About />
  {:else if route === 'privacy'}
    <PrivacyPolicy />
  {:else}
    <Home />
  {/if}
</main>

<div class="wrap">
  <footer class="site">
    <span>Scalir · private &amp; free · open source · no uploads</span>
    <span><a href="/privacy">Privacy</a> · Built by Shad · MIT licensed</span>
  </footer>
</div>
