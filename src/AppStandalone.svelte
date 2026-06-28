<script lang="ts">
  import Tool from './lib/Tool.svelte';
  const base = import.meta.env.BASE_URL;
  const HOME = 'https://scalir.org';
</script>

<nav class="nav">
  <div class="nav-inner">
    <a class="brand" href={HOME} target="_blank" rel="noreferrer">
      <img src={base + 'favicon-256.png'} alt="" /> Scalir
    </a>
  </div>
</nav>

<div class="wrap" style="padding-top: 32px">
  <Tool />
</div>

<div class="wrap">
  <footer class="site">
    <span>Scalir · private &amp; free · open source · no uploads</span>
    <span><a href={HOME} target="_blank" rel="noreferrer">scalir.org</a> · Built by Shad · MIT licensed</span>
  </footer>
</div>
