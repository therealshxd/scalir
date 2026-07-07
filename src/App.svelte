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

  const base = import.meta.env.BASE_URL;

  function parse(): 'home' | 'self-hosting' | 'download' | 'roadmap' | 'features' | 'about' | 'privacy' {
    const h = (location.hash || '').replace(/^#\/?/, '');
    return h === 'self-hosting' ? 'self-hosting'
      : h === 'download' ? 'download'
      : h === 'roadmap' ? 'roadmap'
      : h === 'features' ? 'features'
      : h === 'about' ? 'about'
      : h === 'privacy' ? 'privacy'
      : 'home';
  }
  let route = $state(parse());

  onMount(() => {
    // Record a pageview on every route change. The initial view is fired once the Umami script
    // loads (see analytics.ts); this covers all subsequent hash navigations.
    const onHash = () => { route = parse(); window.scrollTo({ top: 0 }); trackPageview(); };
    window.addEventListener('hashchange', onHash);
    const stopScroll = initScrollDepth();
    const stopClicks = initClickTracking();
    return () => { window.removeEventListener('hashchange', onHash); stopScroll(); stopClicks(); };
  });

  function gotoTool(e: Event) {
    e.preventDefault();
    if (route !== 'home') location.hash = '#/';
    setTimeout(() => document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' }), 60);
  }
</script>

<nav class="nav">
  <div class="nav-inner">
    <a class="brand" href="#/"><img src={base + 'favicon-256.png'} alt="" /> Scalir</a>
    <div class="links">
      <a href="#/" onclick={gotoTool}>Try Scalir</a>
      <a href="#/features">Features</a>
      <a href="#/roadmap">Roadmap</a>
      <a href="#/self-hosting">Self-hosting</a>
      <a href="#/download">Download</a>
      <a href="#/about">About</a>
    </div>
  </div>
</nav>

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

<div class="wrap">
  <footer class="site">
    <span>Scalir · private &amp; free · open source · no uploads</span>
    <span><a href="#/privacy">Privacy</a> · Built by Shad · MIT licensed</span>
  </footer>
</div>
