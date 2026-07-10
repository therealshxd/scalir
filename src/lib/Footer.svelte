<script lang="ts">
  // Site footer: grouped link columns generated from the shared route registry — this is the
  // internal-linking mesh that gets every landing page crawled from every page. Columns appear
  // only once their group has routes (Resize/Compare arrive in later batches). The bottom
  // tagline row is the original footer, unchanged.
  import { ROUTE_LIST, type RouteEntry } from './routes.data.js';

  const COLUMNS: { label: string; entries: RouteEntry[] }[] = [
    { label: 'Convert', entries: ROUTE_LIST.filter((r) => r.group === 'convert') },
    { label: 'Compress', entries: ROUTE_LIST.filter((r) => r.group === 'compress') },
    { label: 'Resize', entries: ROUTE_LIST.filter((r) => r.group === 'resize') },
    { label: 'Compare', entries: ROUTE_LIST.filter((r) => r.group === 'compare') },
    {
      label: 'Product',
      entries: ROUTE_LIST.filter((r) => r.group === 'product' && r.id !== 'home'),
    },
  ].filter((c) => c.entries.length > 0);
</script>

<div class="wrap">
  <footer class="site">
    <div class="cols">
      {#each COLUMNS as col}
        <nav class="col" aria-label="{col.label} pages">
          <p class="col-title">{col.label}</p>
          <ul>
            {#each col.entries as r}
              <li><a href={r.path}>{r.crumb}</a></li>
            {/each}
          </ul>
        </nav>
      {/each}
    </div>
    <div class="byline">
      <span>Scalir · private &amp; free · open source · no uploads</span>
      <span><a href="/privacy">Privacy</a> · Built by Shad · MIT licensed</span>
    </div>
  </footer>
</div>

<style>
  /* The global footer.site is a flex row (built for the old two-span byline); this footer
     stacks columns above the byline instead. */
  footer.site { display: block; }
  .cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 22px;
    padding: 2px 0 18px; }
  .col-title { margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: .05em;
    text-transform: uppercase; color: var(--muted); }
  .col ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .col a { color: var(--text); font-size: 13.5px; text-decoration: none; opacity: .85; }
  .col a:hover { color: var(--accent); opacity: 1; }
  .byline { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px;
    padding: 14px 0 4px; border-top: 1px solid var(--line); }
</style>
