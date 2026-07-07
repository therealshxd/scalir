<script lang="ts">
  import JSZip from 'jszip';
  import { SUPPORTED_EXT, extOf } from '../core/rules';
  import { makeOutName, withSequenceNumber } from '../core/naming';
  import type { Options, OptimiseResult } from '../core/types';
  import { PRESETS, presetSummary, type Preset } from '../core/presets';
  import {
    loadSettings, saveSettings, loadCustomPresets, saveCustomPresets,
  } from './persist';
  import { WorkerPool, defaultPoolSize } from './workerPool';
  import { track } from './analytics';
  import Compare from './Compare.svelte';

  type Queued = { name: string; bytes: Uint8Array; size: number };
  type Row = OptimiseResult;

  const FREE_LIMIT = 0;
  const hasFS = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  // Hydrate from localStorage so a returning visitor keeps their last-used settings; falls
  // back to defaults when nothing is stored (or storage is unavailable). Persisted on change.
  let opts = $state(loadSettings());
  $effect(() => { saveSettings($state.snapshot(opts)); });

  // Live example of how the current naming settings shape an output filename.
  let namePreview = $derived.by(() => {
    let n = makeOutName('My Photo.JPG', {
      prefix: opts.prefix, rename: opts.rename, suffix: opts.suffix,
      lowercase: opts.lowercase, slugify: opts.slugify,
    }, null);
    if (opts.sequential) n = withSequenceNumber(n, 1, 1);
    return n;
  });

  // A fixed rename applied to a whole batch would make every file collide, so switch on
  // sequential numbering as soon as the user types a name (they can still turn it back off).
  function onRenameInput() {
    clearPreset();
    if (opts.rename.trim()) opts.sequential = true;
  }

  // User-saved presets, shown alongside the built-ins and individually deletable.
  let customPresets = $state<Preset[]>(loadCustomPresets());
  let allPresets = $derived<Preset[]>([...PRESETS, ...customPresets]);
  // Which preset's values are currently loaded; cleared as soon as a field is edited.
  let activePreset = $state<string | null>(null);
  // Inline "save as preset" state (avoids window.prompt, unreliable in Tauri WebView).
  // A custom preset gets a title (required) and an optional description shown on its chip.
  let namingPreset = $state(false);
  let newPresetName = $state('');
  let newPresetDesc = $state('');
  const cancelNaming = () => { namingPreset = false; newPresetName = ''; newPresetDesc = ''; };

  function applyPreset(p: Preset) {
    opts.resizeMode = 'longest'; // presets are longest-side snapshots
    opts.maxDim = p.opts.maxDim;
    opts.maxMB = p.opts.maxBytes / (1024 * 1024);
    opts.outputFormat = p.opts.outputFormat;
    opts.qualityFloor = p.opts.qualityFloor;
    opts.allowWebp = p.opts.allowWebp;
    activePreset = p.id;
  }
  // Custom edits override a preset — drop the highlight so it reads as "custom".
  const clearPreset = () => { activePreset = null; };

  function saveAsPreset() {
    const name = newPresetName.trim();
    if (!name) return;
    const preset: Preset = {
      id: 'custom-' + Date.now(),
      name,
      blurb: newPresetDesc.trim(), // user-written description (may be empty)
      savings: '',
      origin: 'custom',
      opts: {
        maxDim: opts.maxDim,
        maxBytes: Math.round(opts.maxMB * 1024 * 1024),
        outputFormat: opts.outputFormat,
        qualityFloor: opts.qualityFloor,
        allowWebp: opts.allowWebp,
      },
    };
    customPresets = [...customPresets, preset];
    saveCustomPresets($state.snapshot(customPresets));
    activePreset = preset.id;
    cancelNaming();
  }
  function deletePreset(id: string) {
    customPresets = customPresets.filter((p) => p.id !== id);
    saveCustomPresets($state.snapshot(customPresets));
    if (activePreset === id) activePreset = null;
  }
  let queue = $state<Queued[]>([]);
  // Results are index-aligned to `queue` so out-of-order completions (the pool runs
  // images in parallel) still render in original order; `rows` is the completed subset.
  let results = $state<(Row | undefined)[]>([]);
  let rows = $derived(results.filter((r): r is Row => !!r));
  let processing = $state(false);
  let done = $derived(rows.length);
  let notice = $state('');
  let dragOver = $state(false);
  // Per-image compare/quality modal: compareIndex is the queue index being compared; editedIdx
  // marks rows whose result was manually re-encoded in the compare view (overriding the batch cap).
  let compareIndex = $state<number | null>(null);
  let editedIdx = $state<Set<number>>(new Set());

  const poolSize = defaultPoolSize();
  let activePool: WorkerPool | null = null;

  const isImage = (name: string) => SUPPORTED_EXT.includes(extOf(name));
  const kb = (n: number) => (n / 1024).toFixed(1) + ' KB';
  function clearNotice() { notice = ''; }

  async function addFiles(files: File[]) {
    clearNotice();
    const imgs = files.filter((f) => isImage(f.name));
    const skipped = files.length - imgs.length;
    let toAdd = imgs;
    if (FREE_LIMIT > 0 && queue.length + imgs.length > FREE_LIMIT) {
      const room = Math.max(0, FREE_LIMIT - queue.length);
      toAdd = imgs.slice(0, room);
      notice = `Free limit is ${FREE_LIMIT} images per session — ${imgs.length - room} not added. ` +
        `Self-host for unlimited use.`;
    }
    const loaded: Queued[] = [];
    for (const f of toAdd) {
      const bytes = new Uint8Array(await f.arrayBuffer());
      loaded.push({ name: f.name, bytes, size: bytes.length });
    }
    queue = [...queue, ...loaded];
    if (toAdd.length) track('images-added', { count: toAdd.length });
    if (skipped > 0 && !notice) notice = `${skipped} non-image file(s) ignored.`;
  }

  function onInput(e: Event) {
    const t = e.target as HTMLInputElement;
    if (t.files) addFiles(Array.from(t.files));
    t.value = '';
  }
  function onDrop(e: DragEvent) {
    e.preventDefault(); dragOver = false;
    if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files));
  }
  async function pickFolder() {
    try {
      const dir = await (window as any).showDirectoryPicker();
      const files: File[] = [];
      for await (const entry of dir.values()) {
        if (entry.kind === 'file' && isImage(entry.name)) files.push(await entry.getFile());
      }
      if (!files.length) { notice = 'No supported images found in that folder.'; return; }
      addFiles(files);
    } catch { /* cancelled */ }
  }
  function reset() { queue = []; results = []; editedIdx = new Set(); compareIndex = null; clearNotice(); }

  // The engine submit-map, built from the current UI settings. Shared by the batch run and the
  // per-image compare re-encode so both always optimise with identical options.
  function buildOpts(): Partial<Options> {
    return {
      resizeMode: opts.resizeMode, maxDim: opts.maxDim, targetW: opts.targetW,
      targetH: opts.targetH, percent: opts.percent,
      maxBytes: Math.round(opts.maxMB * 1024 * 1024),
      prefix: opts.prefix, rename: opts.rename, suffix: opts.suffix,
      lowercase: opts.lowercase, slugify: opts.slugify,
      allowWebp: opts.allowWebp, qualityFloor: opts.qualityFloor, outputFormat: opts.outputFormat,
    };
  }

  function openCompare(i: number) { compareIndex = i; track('compare-opened'); }
  // Commit a single image's result (from the compare) into the batch at its original index —
  // used both to tweak an already-optimised row and to optimise a still-queued image on its own,
  // leaving the rest queued. download/ZIP/save all read `results`, so it flows through. Sequential
  // numbering is applied here (as in run()) so a single commit still matches the batch naming.
  function optimiseOne(i: number, r: OptimiseResult, quality: number) {
    if (opts.sequential && r.outName) r.outName = withSequenceNumber(r.outName, i + 1, queue.length);
    const next = results.slice(); next[i] = r; results = next;
    editedIdx = new Set(editedIdx).add(i);
    track('optimise-single', { quality });
    compareIndex = null;
  }
  // Close the compare and run the normal size-target batch over every image.
  function optimiseBatchFromCompare() { compareIndex = null; run(); }

  // The engine runs in a pool of Web Workers so the heavy WASM decode/encode stays off
  // the main thread and several images process in parallel across CPU cores. Each result
  // is placed at its original queue index so the displayed order never depends on which
  // worker finishes first. Input bytes are structured-cloned (not transferred) so the
  // queue stays intact and a batch can be re-run.
  async function run() {
    if (!queue.length || processing) return;
    track('optimise', { images: queue.length });
    processing = true; results = new Array(queue.length); editedIdx = new Set(); clearNotice();
    const o = buildOpts();
    // Sequential numbering is applied here (not in the worker): the pool completes images
    // out of order, so the stable queue index `i` — not the worker id — is the file's number.
    const total = queue.length;
    const seq = opts.sequential;
    const pool = new WorkerPool(poolSize);
    activePool = pool;
    await Promise.all(queue.map(async (item, i) => {
      const r = await pool.submit({ name: item.name, bytes: item.bytes, opts: o });
      if (r) {
        if (seq && r.outName) r.outName = withSequenceNumber(r.outName, i + 1, total);
        const next = results.slice(); next[i] = r; results = next; // null = cancelled
      }
    }));
    pool.terminate();
    activePool = null;
    processing = false;
  }

  function cancel() {
    if (!processing) return;
    activePool?.terminate(); // settles outstanding jobs with null so run() unblocks
    notice = `Cancelled — optimised ${done} of ${queue.length}.`;
  }

  function download(r: Row) {
    if (!r.outBytes) return;
    const blob = new Blob([r.outBytes as BlobPart], { type: r.outType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = r.outName; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
  }
  async function downloadZip() {
    const zip = new JSZip();
    for (const r of rows) if (r.outBytes) zip.file(r.outName, r.outBytes);
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'scalir-optimised.zip'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
  }
  async function saveToFolder() {
    try {
      const dir = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      for (const r of rows) {
        if (!r.outBytes) continue;
        const fh = await dir.getFileHandle(r.outName, { create: true });
        const w = await fh.createWritable(); await w.write(r.outBytes); await w.close();
      }
      notice = `Saved ${rows.filter((r) => r.outBytes).length} file(s) to the chosen folder.`;
    } catch { /* cancelled */ }
  }

  let totalSaved = $derived(rows.reduce((s, r) => s + Math.max(0, r.origBytes - r.newBytes), 0));
  let outputs = $derived(rows.filter((r) => r.outBytes).length);
</script>

<div class="tool" id="tool">
  <div
    class="drop {dragOver ? 'over' : ''}"
    role="button" tabindex="0"
    ondragover={(e) => { e.preventDefault(); dragOver = true; }}
    ondragleave={() => (dragOver = false)}
    ondrop={onDrop}
  >
    <p class="big">Drop images here</p>
    <p class="muted">or</p>
    <div class="pickrow">
      <label class="btn">Choose files<input type="file" accept="image/*" multiple onchange={onInput} hidden /></label>
      {#if hasFS}<button class="btn ghost" onclick={pickFolder}>Choose folder…</button>{/if}
    </div>
    <p class="muted small">JPG, PNG, WebP, AVIF, HEIC, GIF, TIFF, BMP · processed on your device, never uploaded</p>
  </div>

  {#if notice}<p class="notice">{notice}</p>{/if}

  <div class="acc" class:open={opts.presetsOpen}>
    <button type="button" class="acc-head" aria-expanded={opts.presetsOpen} onclick={() => (opts.presetsOpen = !opts.presetsOpen)}>
      <span class="toggle" aria-hidden="true"></span><span class="acc-title">Quick presets</span>
    </button>
    {#if opts.presetsOpen}
    <div class="acc-body">
    <div class="chips">
      {#each allPresets as p}
        <div class="chip-wrap">
          <!-- The whole card is the button: title, description, and the settings breakdown
               are all visible inline (no hover needed — works on touch/mobile). -->
          <button
            type="button"
            class="preset {activePreset === p.id ? 'active' : ''} {p.origin === 'custom' ? 'has-del' : ''}"
            onclick={() => applyPreset(p)}
          >
            <span class="preset-head">
              <span class="preset-title">{p.name}</span>
              {#if p.origin !== 'custom' && p.savings}<span class="preset-savings">{p.savings}</span>{/if}
            </span>
            {#if p.blurb}<span class="preset-desc">{p.blurb}</span>{/if}
            <span class="preset-rows">
              {#each presetSummary(p.opts) as row}
                <span class="preset-row"><span class="preset-label">{row.label}</span><span class="preset-val">{row.value}</span></span>
              {/each}
            </span>
          </button>
          {#if p.origin === 'custom'}
            <button
              type="button"
              class="chip-del"
              title="Delete this preset"
              aria-label="Delete preset {p.name}"
              onclick={() => deletePreset(p.id)}
            >×</button>
          {/if}
        </div>
      {/each}
    </div>
    <div class="save-preset">
      {#if namingPreset}
        <div class="preset-form">
          <!-- svelte-ignore a11y_autofocus -->
          <input
            class="preset-name" type="text" placeholder="Preset title" maxlength="40"
            bind:value={newPresetName} autofocus
            onkeydown={(e) => { if (e.key === 'Enter') saveAsPreset(); if (e.key === 'Escape') cancelNaming(); }}
          />
          <input
            class="preset-name" type="text" placeholder="Description (optional)" maxlength="80"
            bind:value={newPresetDesc}
            onkeydown={(e) => { if (e.key === 'Enter') saveAsPreset(); if (e.key === 'Escape') cancelNaming(); }}
          />
          <div class="preset-form-actions">
            <button class="btn small" disabled={!newPresetName.trim()} onclick={saveAsPreset}>Save preset</button>
            <button class="link" onclick={cancelNaming}>Cancel</button>
          </div>
        </div>
      {:else}
        <button class="link" onclick={() => { namingPreset = true; newPresetName = ''; newPresetDesc = ''; }}>+ Save current settings as a preset</button>
      {/if}
    </div>
    </div>
    {/if}
  </div>

  <div class="acc" class:open={opts.settingsOpen}>
    <button type="button" class="acc-head" aria-expanded={opts.settingsOpen} onclick={() => (opts.settingsOpen = !opts.settingsOpen)}>
      <span class="toggle" aria-hidden="true"></span><span class="acc-title">Settings</span>
    </button>
    {#if opts.settingsOpen}
    <div class="acc-body">
      <!-- Simple: the essentials most people need. -->
      <div class="grid2">
        <label>Max size (MB)
          <div class="slider-row">
            <input type="range" min="0.1" max="10" step="0.1" bind:value={opts.maxMB} oninput={clearPreset} />
            <input class="num" type="number" step="0.1" min="0.1" bind:value={opts.maxMB} oninput={clearPreset} />
          </div>
          <span class="hint">Target file size — we compress just enough to fit under this.</span>
        </label>
        <label>Output format
          <select bind:value={opts.outputFormat} onchange={clearPreset}>
            <option value="auto">Auto (recommended)</option>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="avif">AVIF</option>
          </select>
          <span class="hint">Auto keeps the original, switching to WebP only when it helps. Or force one format (AVIF is the smallest, but slower to encode).</span>
        </label>
      </div>

      <div class="advanced" class:open={opts.advancedOpen}>
        <button type="button" class="adv-head" aria-expanded={opts.advancedOpen} onclick={() => (opts.advancedOpen = !opts.advancedOpen)}>
          <span class="toggle sm" aria-hidden="true"></span><span class="adv-title">Advanced settings</span>
        </button>
        {#if opts.advancedOpen}
        <div class="advanced-body">
          <div class="grid2">
            <label>Resize
              <select bind:value={opts.resizeMode} onchange={clearPreset}>
                <option value="longest">Longest side</option>
                <option value="width">Exact width</option>
                <option value="height">Exact height</option>
                <option value="percent">Percentage</option>
              </select>
              {#if opts.resizeMode === 'longest'}
                <input class="resize-val" type="number" min="1" bind:value={opts.maxDim} oninput={clearPreset} />
                <span class="hint">Caps the longest side (px), keeping aspect. Images already smaller are left as-is.</span>
              {:else if opts.resizeMode === 'width'}
                <input class="resize-val" type="number" min="1" bind:value={opts.targetW} oninput={clearPreset} />
                <div class="resize-chips">
                  {#each [640, 828, 1080, 1200, 1920] as wq}
                    <button type="button" class="rchip {opts.targetW === wq ? 'active' : ''}" onclick={() => { opts.targetW = wq; clearPreset(); }}>{wq}</button>
                  {/each}
                </div>
                <span class="hint">Scales to this width (px), keeping aspect. Only shrinks — smaller images are left as-is.</span>
              {:else if opts.resizeMode === 'height'}
                <input class="resize-val" type="number" min="1" bind:value={opts.targetH} oninput={clearPreset} />
                <span class="hint">Scales to this height (px), keeping aspect. Only shrinks — smaller images are left as-is.</span>
              {:else}
                <div class="slider-row">
                  <input type="range" min="1" max="100" step="1" bind:value={opts.percent} oninput={clearPreset} />
                  <input class="num" type="number" min="1" max="100" bind:value={opts.percent} oninput={clearPreset} />
                </div>
                <span class="hint">Scales both sides to this percentage. 100% leaves the image unchanged.</span>
              {/if}
            </label>
            <label>Quality floor
              <div class="slider-row">
                <input type="range" min="1" max="100" step="1" bind:value={opts.qualityFloor} oninput={clearPreset} />
                <input class="num" type="number" min="1" max="100" bind:value={opts.qualityFloor} oninput={clearPreset} />
              </div>
              <span class="hint">Lowest quality we'll allow while hitting your size target. Higher = better looking but larger.</span>
            </label>
          </div>
          <label class="check">
            <input type="checkbox" bind:checked={opts.allowWebp} onchange={clearPreset} />
            Allow WebP conversion
            <span class="hint">In Auto mode, lets us switch to WebP to hit your size target.</span>
          </label>

          <p class="group-title">File names</p>
          <div class="grid3">
            <label>Prefix
              <input type="text" bind:value={opts.prefix} oninput={clearPreset} />
              <span class="hint">Added to the start of each saved file's name.</span>
            </label>
            <label>File name
              <input type="text" placeholder="(keep original name)" bind:value={opts.rename} oninput={onRenameInput} />
              <span class="hint">Rename every file to this. Blank keeps the original name.</span>
            </label>
            <label>Suffix
              <input type="text" bind:value={opts.suffix} oninput={clearPreset} />
              <span class="hint">Added to the end of the name, before the extension.</span>
            </label>
          </div>
          <div class="naming-opts">
            <label class="check">
              <input type="checkbox" bind:checked={opts.lowercase} onchange={clearPreset} />
              Lowercase filenames
            </label>
            <label class="check">
              <input type="checkbox" bind:checked={opts.slugify} onchange={clearPreset} />
              Slugify (spaces → dashes)
            </label>
            <label class="check">
              <input type="checkbox" bind:checked={opts.sequential} onchange={clearPreset} />
              Sequential numbering
            </label>
          </div>
          <p class="name-preview">Example: <span class="muted">My Photo.JPG</span> → <b>{namePreview}</b></p>

          <details class="help">
            <summary>What do these mean?</summary>
            <ul>
              <li><b>Presets</b> fill the settings for a common goal. Tweaking any field switches you back to custom settings.</li>
              <li><b>Max dimension</b> caps the longest side (width or height) in pixels — aspect ratio is always kept, nothing is cropped or stretched. An image already under the cap isn't enlarged.</li>
              <li><b>Max size</b> is your file-size target. We reduce quality just enough to land under it without going lower than the quality floor.</li>
              <li><b>Output format</b> — <i>Auto</i> keeps your original format (and only converts to WebP when that meaningfully helps). Pick JPEG for maximum compatibility, WebP for the smallest files, or PNG to stay lossless.</li>
              <li><b>Quality floor</b> is the worst quality we're willing to use to hit the size target. If we can't fit under your size even at the floor, we stop there and flag it rather than ruining the image.</li>
            </ul>
          </details>
        </div>
        {/if}
      </div>
    </div>
    {/if}
  </div>

  <div class="actions">
    <button class="btn primary" disabled={!queue.length || processing} onclick={run}>
      {processing ? `Optimising ${done}/${queue.length}…` : `Optimise all ${queue.length || ''} image${queue.length === 1 ? '' : 's'}`}
    </button>
    {#if processing}<button class="btn ghost" onclick={cancel}>Cancel</button>{/if}
    {#if queue.length && !processing}<button class="btn ghost" onclick={reset}>Clear</button>{/if}
    {#if outputs > 0 && !processing}
      <button class="btn" onclick={downloadZip}>Download all (ZIP)</button>
      {#if hasFS}<button class="btn ghost" onclick={saveToFolder}>Save all to folder…</button>{/if}
    {/if}
  </div>

  {#if processing}
    <div class="bar"><div style="width:{(done / queue.length) * 100}%"></div></div>
    <p class="muted small">Optimising {done}/{queue.length} across {poolSize} core{poolSize === 1 ? '' : 's'} — fully on your device.</p>
  {/if}

  {#if queue.length > 0}
    <div class="panel">
      {#if rows.length}
        <div class="summary">
          <div><b>{outputs}</b><span>optimised</span></div>
          <div><b>{rows.filter((r) => r.resized).length}</b><span>resized</span></div>
          <div><b>{rows.filter((r) => r.converted).length}</b><span>converted</span></div>
          <div><b>{(totalSaved / 1048576).toFixed(1)} MB</b><span>saved</span></div>
        </div>
      {:else if !processing}
        <p class="queue-title">{queue.length} image{queue.length === 1 ? '' : 's'} ready — <span class="muted">Preview any to check quality before optimising, or Optimise all.</span></p>
      {/if}
      <table>
        <thead><tr><th>File</th><th>Result</th><th>Size</th><th></th></tr></thead>
        <tbody>
          {#each queue as item, i}
            {@const r = results[i]}
            <tr>
              <td>{item.name}{#if r?.outName}<br /><span class="muted">→ {r.outName}</span>{/if}</td>
              <td>
                {#if r}
                  <span class="pill {r.status}">{r.status}</span> {r.action}{#if editedIdx.has(i)}<span class="pill edited">edited</span>{/if}{#if r.message}<span class="err"> · {r.message}</span>{/if}
                {:else}
                  <span class="pill queued">queued</span>
                {/if}
              </td>
              <td>{#if r}{kb(r.origBytes)}{#if r.newBytes} → {kb(r.newBytes)}{/if}{:else}{kb(item.size)}{/if}</td>
              <td class="row-actions">
                {#if r?.outBytes}
                  <button class="link" onclick={() => openCompare(i)}>Compare</button><button class="link" onclick={() => download(r)}>Download</button>
                {:else if !r && !processing}
                  <button class="link" onclick={() => openCompare(i)}>Preview</button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if compareIndex !== null && queue[compareIndex]}
  {@const ci = compareIndex}
  <Compare
    item={queue[ci]}
    result={results[ci] ?? undefined}
    baseOpts={buildOpts()}
    onApplyImage={(r, q) => optimiseOne(ci, r, q)}
    onOptimiseBatch={optimiseBatchFromCompare}
    onClose={() => (compareIndex = null)}
  />
{/if}

<style>
  .tool { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 22px; }
  .drop { background: #0f1218; border: 2px dashed var(--line); border-radius: 14px;
    padding: 30px 18px; text-align: center; transition: border-color .15s, background .15s; }
  .drop.over { border-color: var(--accent); background: #11202a; }
  .drop .big { font-size: 18px; margin: 0 0 4px; font-weight: 600; }
  .muted { color: var(--muted); }
  .small { font-size: 12.5px; }
  .pickrow { display: flex; gap: 10px; justify-content: center; margin: 10px 0; flex-wrap: wrap; }
  .btn { display: inline-block; background: var(--accent); color: var(--accent-ink); border: 0;
    border-radius: 9px; padding: 10px 16px; font-size: 14px; font-weight: 600; cursor: pointer;
    transition: filter .08s, transform .08s; }
  .btn:hover:not(:disabled) { filter: brightness(1.08); }
  .btn:active:not(:disabled) { transform: translateY(1px); }
  .btn.primary { padding: 12px 20px; }
  .btn.ghost { background: transparent; color: var(--accent); border: 1px solid var(--accent); }
  .btn:disabled { opacity: .45; cursor: default; }
  .actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 16px; }
  /* Collapsible panels (presets / settings) — a compact, left-aligned header with a stylised
     +/− toggle button. Closed = just the header row, kept tight. */
  .acc { border: 1px solid var(--line); border-radius: 12px; margin-top: 12px; }
  .acc-head { width: 100%; background: none; border: 0; cursor: pointer; text-align: left;
    display: flex; align-items: center; gap: 12px; padding: 10px 14px; }
  .acc-title { font-size: 17px; font-weight: 700; color: var(--text); transition: color .08s; }
  .acc-head:hover .acc-title { color: var(--accent); }
  .acc-body { padding: 4px 14px 14px; }

  /* Stylised toggle: a rounded button drawing a "+" that becomes "−" when the panel opens. */
  .toggle { position: relative; flex: none; width: 26px; height: 26px; border-radius: 8px;
    border: 1px solid var(--line); background: #0f1218; transition: border-color .08s, background .08s; }
  .toggle.sm { width: 20px; height: 20px; border-radius: 6px; }
  .toggle::before, .toggle::after { content: ''; position: absolute; top: 50%; left: 50%;
    background: var(--accent); border-radius: 2px; transition: transform .1s ease; }
  .toggle::before { width: 12px; height: 2px; transform: translate(-50%, -50%); }
  .toggle::after { width: 2px; height: 12px; transform: translate(-50%, -50%); }
  .toggle.sm::before { width: 9px; }
  .toggle.sm::after { height: 9px; }
  .acc.open .toggle::after, .advanced.open .toggle::after { transform: translate(-50%, -50%) scaleY(0); }
  .acc-head:hover .toggle, .adv-head:hover .toggle { border-color: var(--accent); background: #11202a; }

  /* Advanced sub-expander inside the Settings panel. */
  .advanced { margin-top: 16px; border-top: 1px solid var(--line); padding-top: 12px; }
  .adv-head { width: 100%; background: none; border: 0; cursor: pointer; text-align: left;
    display: flex; align-items: center; gap: 10px; padding: 0; }
  .adv-title { font-size: 14px; font-weight: 600; color: var(--accent); }
  .advanced-body { margin-top: 12px; }
  .group-title { margin: 16px 0 0; font-size: 12px; font-weight: 700; letter-spacing: .04em;
    text-transform: uppercase; color: var(--muted); }

  .grid2, .grid3 { display: grid; gap: 12px; align-items: start; }
  .grid2 { grid-template-columns: repeat(2, 1fr); }
  .grid3 { grid-template-columns: repeat(3, 1fr); }

  /* Range + textbox pair, bound to the same value. */
  .slider-row { display: flex; align-items: center; gap: 10px; margin-top: 5px; }
  .slider-row input[type=range] { flex: 1; margin: 0; accent-color: var(--accent); }
  .slider-row input.num { width: 72px; flex: none; margin-top: 0; }

  /* Responsive-width quick-picks for the Exact width resize mode. */
  .resize-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .rchip { background: #0f1218; border: 1px solid var(--line); color: var(--text); border-radius: 7px;
    padding: 5px 9px; font-size: 12px; font-weight: 600; cursor: pointer; transition: border-color .08s, background .08s; }
  .rchip:hover { border-color: var(--accent); }
  .rchip.active { border-color: var(--accent); background: #11202a; color: var(--accent); }

  label { display: block; font-size: 13px; color: var(--muted); font-weight: 600; }
  input[type=number], input[type=text], select { width: 100%; margin-top: 5px; background: #0f1218;
    border: 1px solid var(--line); color: var(--text); border-radius: 8px; padding: 9px 10px; font-size: 14px; }
  .hint { display: block; margin-top: 5px; font-size: 11.5px; font-weight: 400; color: var(--muted); line-height: 1.4; }
  .check { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; color: var(--text); font-weight: 500; }
  .check input { width: auto; }
  .check .hint { flex-basis: 100%; margin-top: 2px; }
  .naming-opts { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 10px; }
  .naming-opts .check { margin-top: 0; }
  .name-preview { margin-top: 12px; font-size: 12.5px; color: var(--muted); }
  .name-preview b { color: var(--accent); font-weight: 600; word-break: break-all; }

  /* Preset cards: compact by default (title + description + savings); the settings breakdown
     is revealed only when the card is active or hovered/focused — active-tap covers mobile.
     Laid out in a responsive grid that stacks to one column on narrow screens. */
  .chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
  .chip-wrap { position: relative; }
  .preset { display: flex; flex-direction: column; gap: 4px; width: 100%; text-align: left;
    background: #0f1218; border: 1px solid var(--line); color: var(--text); border-radius: 12px;
    padding: 12px 14px; cursor: pointer; transition: border-color .08s, background .08s, transform .08s; }
  .preset:hover { border-color: var(--accent); transform: translateY(-2px); }
  .preset.active { border-color: var(--accent); background: #11202a; }
  .preset-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .preset.has-del .preset-head { padding-right: 22px; } /* clear the delete × */
  .preset-title { font-size: 14px; font-weight: 700; }
  .preset-savings { font-size: 11px; color: var(--accent); font-weight: 600; white-space: nowrap; flex: none; }
  .preset-desc { font-size: 12px; color: var(--muted); line-height: 1.4; }
  .preset-rows { display: none; gap: 3px; margin-top: 6px; border-top: 1px solid var(--line); padding-top: 8px; }
  .preset.active .preset-rows,
  .chip-wrap:hover .preset-rows,
  .chip-wrap:focus-within .preset-rows { display: grid; }
  .preset-row { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; }
  .preset-label { color: var(--muted); }
  .preset-val { color: var(--text); font-weight: 600; white-space: nowrap; }
  .chip-del { position: absolute; top: 8px; right: 8px; width: 20px; height: 20px; padding: 0;
    display: flex; align-items: center; justify-content: center; border-radius: 50%;
    border: 1px solid var(--line); background: #0f1218; color: var(--muted);
    font-size: 13px; line-height: 1; cursor: pointer; transition: color .15s, border-color .15s; }
  .chip-del:hover { color: var(--err); border-color: var(--err); }
  .save-preset { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 10px; }
  .preset-form { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .preset-form-actions { display: flex; align-items: center; gap: 10px; }
  input.preset-name { width: auto; flex: 0 1 220px; margin-top: 0; }
  .btn.small { padding: 7px 12px; font-size: 13px; }

  .help { margin-top: 14px; border-top: 1px solid var(--line); padding-top: 12px; }
  .help summary { cursor: pointer; font-size: 13px; font-weight: 600; color: var(--accent); }
  .help ul { margin: 10px 0 0; padding-left: 18px; }
  .help li { font-size: 12.5px; color: var(--muted); line-height: 1.5; margin-bottom: 6px; }
  .help b { color: var(--text); }
  .notice { background: #1d1a0e; border: 1px solid #4a4222; color: var(--warn);
    padding: 10px 14px; border-radius: 9px; font-size: 13.5px; margin-top: 14px; }
  .bar { height: 8px; background: #0f1218; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; margin: 14px 0; }
  .bar > div { height: 100%; background: var(--accent); transition: width .15s; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
  .summary div { background: #0f1218; border: 1px solid var(--line); border-radius: 9px; padding: 10px; }
  .summary b { display: block; font-size: 19px; }
  .summary span { color: var(--muted); font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { color: var(--muted); }
  .pill { font-size: 11px; padding: 1px 8px; border-radius: 20px; }
  .pill.ok { background: rgba(56,193,114,.16); color: var(--ok); }
  .pill.skipped { background: rgba(154,163,178,.16); color: var(--muted); }
  .pill.queued { background: rgba(154,163,178,.16); color: var(--muted); }
  .pill.error { background: rgba(239,83,80,.16); color: var(--err); }
  .pill.edited { border: 1px solid var(--accent); color: var(--accent); margin-left: 6px; }
  .err { color: var(--err); }
  .row-actions { white-space: nowrap; }
  .row-actions button + button { margin-left: 12px; }
  .link { background: none; border: 0; color: var(--accent); cursor: pointer; padding: 0; font-size: 13px; text-decoration: underline; }
  .panel { margin-top: 16px; }
  .queue-title { font-size: 13px; font-weight: 600; margin: 0 0 10px; }
  @media (max-width: 560px) {
    .summary { grid-template-columns: repeat(2, 1fr); }
    .grid2, .grid3 { grid-template-columns: 1fr; }
  }
</style>
