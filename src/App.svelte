<script lang="ts">
  import { onMount } from 'svelte';
  import Home from './lib/Home.svelte';
  import SelfHosting from './lib/SelfHosting.svelte';
  import Download from './lib/Download.svelte';

  const base = import.meta.env.BASE_URL;

  function parse(): 'home' | 'self-hosting' | 'download' {
    const h = (location.hash || '').replace(/^#\/?/, '');
    return h === 'self-hosting' ? 'self-hosting' : h === 'download' ? 'download' : 'home';
  }
  let route = $state(parse());

  onMount(() => {
    const onHash = () => { route = parse(); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
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
      <a href="#/self-hosting">Self-hosting</a>
      <a href="#/download">Download</a>
    </div>
  </div>
</nav>

{#if route === 'self-hosting'}
  <SelfHosting />
{:else if route === 'download'}
  <Download />
{:else}
  <Home />
{/if}

<div class="wrap">
  <footer class="site">
    <span>Scalir · private &amp; free · open source · no uploads</span>
    <span>Built by Shad · MIT licensed</span>
  </footer>
</div>
