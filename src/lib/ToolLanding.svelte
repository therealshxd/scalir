<script lang="ts">
  // Generic template for the data-driven SEO landing pages: breadcrumb → h1 + lead → the Tool
  // itself (preconfigured — the page must DO the thing the visitor searched for, above the fold)
  // → content sections → FAQ. Everything renders from routes.data.js + landing/content.ts, so
  // adding a page is a data edit, not a new component.
  import { byId } from './routes.data.js';
  import { LANDING_CONTENT } from './landing/content';
  import Tool from './Tool.svelte';
  import Faq from './Faq.svelte';

  let { id }: { id: string } = $props();

  const meta = $derived(byId[id]);
  const c = $derived(LANDING_CONTENT[id]);

  function gotoTool(e: Event) {
    e.preventDefault();
    document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' });
  }
</script>

<div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="/">Home</a><span class="sep" aria-hidden="true">›</span><span>{meta.crumb}</span>
  </nav>

  <section class="section">
    <h1>{c.h1}</h1>
    <p class="lead">{c.lead}</p>
  </section>

  <!-- data-preset-format lets the prerender smoke-check assert the embedded tool really is
       preconfigured (scripts/prerender.mjs compares it against the format select's value). -->
  <section
    class="section tool-sec"
    aria-label="The tool, preconfigured for this task"
    data-preset-format={c.toolPreset?.outputFormat ?? null}
  >
    {#if c.toolNote}<p class="tool-note">{c.toolNote}</p>{/if}
    <!-- Keyed so navigating between landing pages remounts the Tool with the new preset
         (its settings state is initialised once, on mount). -->
    {#key id}
      <Tool preset={c.toolPreset ?? null} />
    {/key}
  </section>

  {#each c.sections as s}
    <section class="section">
      {#if s.type === 'prose'}
        <h2 class="sec-title">{s.h2}</h2>
        {#if s.sub}<p class="sec-sub">{s.sub}</p>{/if}
        {#each s.paragraphs as p}
          <p class="sec-desc">{p}</p>
        {/each}
        {#if s.bullets}
          <ul class="feat-list">
            {#each s.bullets as b}<li>{b}</li>{/each}
          </ul>
        {/if}
      {:else if s.type === 'steps'}
        <h2 class="sec-title">{s.h2}</h2>
        <ol class="steps">
          {#each s.steps as st}
            <li><strong>{st.title}</strong><span>{st.body}</span></li>
          {/each}
        </ol>
      {:else if s.type === 'factTable'}
        <h2 class="sec-title">{s.h2}</h2>
        {#if s.sub}<p class="sec-sub">{s.sub}</p>{/if}
        <div class="tblwrap">
          <table class="fact">
            <thead>
              <tr>{#each s.columns as col}<th>{col}</th>{/each}</tr>
            </thead>
            <tbody>
              {#each s.rows as row}
                <tr>{#each row as cell, ci}{#if ci === 0}<th scope="row">{cell}</th>{:else}<td>{cell}</td>{/if}{/each}</tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if s.type === 'comparison'}
        <h2 class="sec-title">{s.h2}</h2>
        <div class="tblwrap">
          <table class="fact">
            <thead>
              <tr><th></th><th>Scalir</th><th>{s.competitor}</th></tr>
            </thead>
            <tbody>
              {#each s.rows as row}
                <tr><th scope="row">{row.feature}</th><td>{row.scalir}</td><td>{row.other}</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
        <p class="sec-desc verdict">{s.verdict}</p>
      {:else if s.type === 'crossLinks'}
        <h2 class="sec-title">{s.h2}</h2>
        <div class="xlinks">
          {#each s.links as l}
            <a class="xlink" href={l.path}>
              <span class="xlink-label">{l.label}</span>
              {#if l.blurb}<span class="xlink-blurb">{l.blurb}</span>{/if}
            </a>
          {/each}
        </div>
      {/if}
    </section>
  {/each}

  <section class="section">
    <div class="sec-cta">
      <button class="cta" data-track="cta" data-track-value="{id}-try" onclick={gotoTool}>
        Try it now — free &amp; private
      </button>
    </div>
    <h2 class="sec-title">Frequently asked questions</h2>
    <Faq items={c.faq} open />
  </section>
</div>

<style>
  .crumbs { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted);
    padding-top: 18px; }
  .crumbs a { color: var(--muted); text-decoration: none; }
  .crumbs a:hover { color: var(--accent); }
  .crumbs .sep { opacity: .6; }

  .tool-sec { margin-top: 4px; }
  .tool-note { margin: 0 0 10px; font-size: 13.5px; color: var(--accent); font-weight: 600; }

  .steps { margin: 14px 0 0; padding-left: 0; list-style: none; counter-reset: step;
    display: grid; gap: 12px; }
  .steps li { counter-increment: step; position: relative; padding: 14px 16px 14px 56px;
    background: var(--panel); border: 1px solid var(--line); border-radius: 12px; }
  .steps li::before { content: counter(step); position: absolute; left: 14px; top: 14px;
    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
    background: #11202a; border: 1px solid var(--accent); color: var(--accent);
    border-radius: 8px; font-weight: 700; font-size: 14px; }
  .steps strong { display: block; font-size: 15px; margin-bottom: 3px; }
  .steps span { color: var(--muted); font-size: 14px; line-height: 1.55; }

  .tblwrap { overflow-x: auto; margin-top: 14px; }
  table.fact { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 480px; }
  .fact th, .fact td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line);
    vertical-align: top; line-height: 1.5; }
  .fact thead th { color: var(--muted); font-size: 12.5px; text-transform: uppercase;
    letter-spacing: .04em; }
  .fact tbody th { color: var(--text); font-weight: 600; white-space: nowrap; }
  .fact td { color: var(--muted); }
  .verdict { margin-top: 12px; }

  .xlinks { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 10px; margin-top: 14px; }
  .xlink { display: flex; flex-direction: column; gap: 4px; background: var(--panel);
    border: 1px solid var(--line); border-radius: 12px; padding: 13px 15px;
    text-decoration: none; transition: border-color .08s, transform .08s; }
  .xlink:hover { border-color: var(--accent); transform: translateY(-2px); }
  .xlink-label { color: var(--accent); font-weight: 700; font-size: 14px; }
  .xlink-blurb { color: var(--muted); font-size: 12.5px; line-height: 1.45; }

  @media (max-width: 560px) {
    .steps li { padding-left: 52px; }
  }
</style>
