<script lang="ts">
  import type { Faq } from './seo';

  // Shared FAQ accordion. Uses native <details>/<summary> so every answer is real text in the DOM
  // (crawlable + keyboard-accessible with zero JS) — never lazy-mounted on click. Items come from
  // seo.ts, the same source the FAQPage JSON-LD is built from, so on-page text and schema stay in sync.
  let { items, open = false }: { items: Faq[]; open?: boolean } = $props();
</script>

<div class="faq-acc">
  {#each items as item, i (item.q)}
    <details open={open && i === 0}>
      <summary>
        <h3>{item.q}</h3>
        <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </summary>
      <div class="faq-body">
        <p>{item.a}{#if item.href}&nbsp;<a href={item.href}>{item.linkText}</a>{/if}</p>
      </div>
    </details>
  {/each}
</div>

<style>
  .faq-acc { display: grid; gap: 10px; margin-top: 14px; }
  details { background: var(--panel); border: 1px solid var(--line); border-radius: 12px;
    overflow: hidden; }
  summary { display: flex; align-items: center; justify-content: space-between; gap: 14px;
    cursor: pointer; padding: 16px 18px; list-style: none; user-select: none; }
  summary::-webkit-details-marker { display: none; }
  summary:hover h3 { color: var(--accent); }
  summary:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  summary h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); line-height: 1.4; }
  .chev { flex: none; color: var(--muted); transition: transform .18s ease; }
  details[open] summary .chev { transform: rotate(180deg); color: var(--accent); }
  .faq-body { padding: 0 18px 16px; }
  .faq-body p { margin: 0; color: var(--muted); line-height: 1.6; max-width: 75ch; }
  .faq-body a { color: var(--accent); }
</style>
