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
      prefix: opts.prefix, suffix: opts.suffix, lowercase: opts.lowercase, slugify: opts.slugify,
    }, null);
    if (opts.sequential) n = withSequenceNumber(n, 1, 1);
    return n;
  });

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
  function reset() { queue = []; results = []; clearNotice(); }

  // The engine runs in a pool of Web Workers so the heavy WASM decode/encode stays off
  // the main thread and several images process in parallel across CPU cores. Each result
  // is placed at its original queue index so the displayed order never depends on which
  // worker finishes first. Input bytes are structured-cloned (not transferred) so the
  // queue stays intact and a batch can be re-run.
  async function run() {
    if (!queue.length || processing) return;
    processing = true; results = new Array(queue.length); clearNotice();
    const o: Partial<Options> = {
      maxDim: opts.maxDim, maxBytes: Math.round(opts.maxMB * 1024 * 1024),
      prefix: opts.prefix, suffix: opts.suffix, lowercase: opts.lowercase, slugify: opts.slugify,
      allowWebp: opts.allowWebp, qualityFloor: opts.qualityFloor, outputFormat: opts.outputFormat,
    };
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

  <div class="panel presets">
    <p class="presets-title">Quick presets</p>
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

  <div class="panel opts">
    <div class="grid">
      <label>Max dimension (px)
        <input type="number" bind:value={opts.maxDim} oninput={clearPreset} min="1" />
        <span class="hint">Maximum length of the longest side. Smaller = smaller file; images already smaller are left as-is.</span>
      </label>
      <label>Max size (MB)
        <input type="number" step="0.1" bind:value={opts.maxMB} oninput={clearPreset} min="0.1" />
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
      <label>Quality floor
        <input type="number" bind:value={opts.qualityFloor} oninput={clearPreset} min="1" max="100" />
        <span class="hint">Lowest quality we'll allow while hitting your size target. Higher = better looking but larger.</span>
      </label>
      <label>Prefix
        <input type="text" bind:value={opts.prefix} oninput={clearPreset} />
        <span class="hint">Added to the start of each saved file's name.</span>
      </label>
      <label>Suffix
        <input type="text" bind:value={opts.suffix} oninput={clearPreset} />
        <span class="hint">Added to the end of the name, before the extension.</span>
      </label>
    </div>
    <label class="check">
      <input type="checkbox" bind:checked={opts.allowWebp} onchange={clearPreset} />
      Allow WebP conversion
      <span class="hint">In Auto mode, lets us switch to WebP to hit your size target.</span>
    </label>
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
        <li><b>Presets</b> fill the settings below for a common goal. Tweaking any field switches you back to custom settings.</li>
        <li><b>Max dimension</b> caps the longest side (width or height) in pixels — aspect ratio is always kept, nothing is cropped or stretched. An image already under the cap isn't enlarged.</li>
        <li><b>Max size</b> is your file-size target. We reduce quality just enough to land under it without going lower than the quality floor.</li>
        <li><b>Output format</b> — <i>Auto</i> keeps your original format (and only converts to WebP when that meaningfully helps). Pick JPEG for maximum compatibility, WebP for the smallest files, or PNG to stay lossless.</li>
        <li><b>Quality floor</b> is the worst quality we're willing to use to hit the size target. If we can't fit under your size even at the floor, we stop there and flag it rather than ruining the image.</li>
      </ul>
    </details>
  </div>

  {#if queue.length > 0 && !processing && !rows.length}
    <div class="panel queue-list">
      <p class="queue-title">{queue.length} image{queue.length === 1 ? '' : 's'} queued</p>
      <ul>
        {#each queue as item}
          <li>
            <span class="q-name">{item.name}</span>
            <span class="muted">{kb(item.size)}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <div class="actions">
    <button class="btn primary" disabled={!queue.length || processing} onclick={run}>
      {processing ? `Optimising ${done}/${queue.length}…` : `Optimise ${queue.length || ''} image${queue.length === 1 ? '' : 's'}`}
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

  {#if rows.length}
    <div class="panel">
      <div class="summary">
        <div><b>{outputs}</b><span>optimised</span></div>
        <div><b>{rows.filter((r) => r.resized).length}</b><span>resized</span></div>
        <div><b>{rows.filter((r) => r.converted).length}</b><span>converted</span></div>
        <div><b>{(totalSaved / 1048576).toFixed(1)} MB</b><span>saved</span></div>
      </div>
      <table>
        <thead><tr><th>File</th><th>Result</th><th>Size</th><th></th></tr></thead>
        <tbody>
          {#each rows as r}
            <tr>
              <td>{r.name}{#if r.outName}<br /><span class="muted">→ {r.outName}</span>{/if}</td>
              <td><span class="pill {r.status}">{r.status}</span> {r.action}{#if r.message}<span class="err"> · {r.message}</span>{/if}</td>
              <td>{kb(r.origBytes)}{#if r.newBytes} → {kb(r.newBytes)}{/if}</td>
              <td>{#if r.outBytes}<button class="link" onclick={() => download(r)}>Download</button>{/if}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

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
    border-radius: 9px; padding: 10px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .btn.primary { padding: 12px 20px; }
  .btn.ghost { background: transparent; color: var(--accent); border: 1px solid var(--accent); }
  .btn:disabled { opacity: .45; cursor: default; }
  .actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 16px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; align-items: start; }
  label { display: block; font-size: 13px; color: var(--muted); font-weight: 600; }
  input[type=number], input[type=text], select { width: 100%; margin-top: 5px; background: #0f1218;
    border: 1px solid var(--line); color: var(--text); border-radius: 8px; padding: 9px 10px; font-size: 14px; }
  .hint { display: block; margin-top: 5px; font-size: 11.5px; font-weight: 400; color: var(--muted); line-height: 1.4; }
  .opts { margin-top: 16px; }
  .check { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; color: var(--text); font-weight: 500; }
  .check input { width: auto; }
  .check .hint { flex-basis: 100%; margin-top: 2px; }
  .naming-opts { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 10px; }
  .naming-opts .check { margin-top: 0; }
  .name-preview { margin-top: 12px; font-size: 12.5px; color: var(--muted); }
  .name-preview b { color: var(--accent); font-weight: 600; word-break: break-all; }

  .presets { margin-top: 16px; }
  .presets-title { font-size: 13px; color: var(--muted); font-weight: 600; margin: 0 0 8px; }
  /* Preset cards: each button shows title, description and the settings breakdown inline,
     laid out in a responsive grid that stacks to one column on narrow screens. */
  .chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
  .chip-wrap { position: relative; }
  .preset { display: flex; flex-direction: column; gap: 4px; width: 100%; text-align: left;
    background: #0f1218; border: 1px solid var(--line); color: var(--text); border-radius: 12px;
    padding: 12px 14px; cursor: pointer; transition: border-color .15s, background .15s; }
  .preset:hover { border-color: var(--accent); }
  .preset.active { border-color: var(--accent); background: #11202a; }
  .preset-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .preset.has-del .preset-head { padding-right: 22px; } /* clear the delete × */
  .preset-title { font-size: 14px; font-weight: 700; }
  .preset-savings { font-size: 11px; color: var(--accent); font-weight: 600; white-space: nowrap; flex: none; }
  .preset-desc { font-size: 12px; color: var(--muted); line-height: 1.4; }
  .preset-rows { display: grid; gap: 3px; margin-top: 6px; border-top: 1px solid var(--line); padding-top: 8px; }
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
  .pill.error { background: rgba(239,83,80,.16); color: var(--err); }
  .err { color: var(--err); }
  .link { background: none; border: 0; color: var(--accent); cursor: pointer; padding: 0; font-size: 13px; text-decoration: underline; }
  .panel { margin-top: 16px; }
  .queue-list { font-size: 13px; }
  .queue-title { font-weight: 600; margin: 0 0 8px; }
  .queue-list ul { list-style: none; margin: 0; padding: 0; }
  .queue-list li { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid var(--line); }
  .queue-list li:last-child { border-bottom: 0; }
  .q-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%; }
  @media (max-width: 560px) { .grid, .summary { grid-template-columns: repeat(2, 1fr); } }
</style>
