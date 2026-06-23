<script lang="ts">
  import JSZip from 'jszip';
  import { SUPPORTED_EXT, extOf } from '../core/rules';
  import type { Options, OptimiseResult } from '../core/types';
  import type { WorkerRequest, WorkerResponse } from './optimise.worker';

  type Queued = { name: string; bytes: Uint8Array; size: number };
  type Row = OptimiseResult;

  const FREE_LIMIT = 0;
  const hasFS = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  let opts = $state({ maxDim: 2000, maxMB: 1, prefix: 'scaled_', allowWebp: true, qualityFloor: 60 });
  let queue = $state<Queued[]>([]);
  let rows = $state<Row[]>([]);
  let processing = $state(false);
  let done = $state(0);
  let notice = $state('');
  let dragOver = $state(false);

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
  function reset() { queue = []; rows = []; done = 0; clearNotice(); }

  // The engine runs in a Web Worker so the heavy WASM decode/encode stays off
  // the main thread. Awaiting each worker message is a real macrotask, so the
  // browser paints each row before the next image starts — no freeze, no dump.
  let worker: Worker | null = null;
  let jobId = 0;
  function getWorker(): Worker {
    worker ??= new Worker(new URL('./optimise.worker.ts', import.meta.url), { type: 'module' });
    return worker;
  }

  function optimiseInWorker(item: Queued, o: Partial<Options>): Promise<Row> {
    const w = getWorker();
    const id = ++jobId;
    return new Promise<Row>((resolve) => {
      const cleanup = () => {
        w.removeEventListener('message', onMessage);
        w.removeEventListener('error', onError);
      };
      const onMessage = (e: MessageEvent<WorkerResponse>) => {
        if (e.data.id !== id) return;
        cleanup();
        resolve(e.data.result);
      };
      const onError = (e: ErrorEvent) => {
        cleanup();
        resolve({ name: item.name, outName: '', status: 'error', action: '', resized: false,
          compressed: false, converted: false, origDims: [0, 0], newDims: [0, 0],
          origBytes: item.size, newBytes: 0, outType: '', message: e.message || 'worker error' });
      };
      w.addEventListener('message', onMessage);
      w.addEventListener('error', onError);
      // Input bytes are structured-cloned (not transferred) so the queue stays
      // intact and the batch can be re-run without detached buffers.
      w.postMessage({ id, name: item.name, bytes: item.bytes, opts: o } satisfies WorkerRequest);
    });
  }

  async function run() {
    if (!queue.length || processing) return;
    processing = true; rows = []; done = 0; clearNotice();
    const o: Partial<Options> = {
      maxDim: opts.maxDim, maxBytes: Math.round(opts.maxMB * 1024 * 1024),
      prefix: opts.prefix, allowWebp: opts.allowWebp, qualityFloor: opts.qualityFloor,
    };
    for (const item of queue) {
      const r = await optimiseInWorker(item, o);
      rows = [...rows, r]; done += 1;
    }
    processing = false;
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
    <p class="muted small">JPG, PNG, WebP · processed on your device, never uploaded</p>
  </div>

  {#if notice}<p class="notice">{notice}</p>{/if}

  <div class="panel opts">
    <div class="grid">
      <label>Max dimension (px)<input type="number" bind:value={opts.maxDim} min="1" /></label>
      <label>Max size (MB)<input type="number" step="0.1" bind:value={opts.maxMB} min="0.1" /></label>
      <label>Prefix<input type="text" bind:value={opts.prefix} /></label>
      <label>Quality floor<input type="number" bind:value={opts.qualityFloor} min="1" max="100" /></label>
    </div>
    <label class="check"><input type="checkbox" bind:checked={opts.allowWebp} /> Allow WebP conversion</label>
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
    {#if queue.length && !processing}<button class="btn ghost" onclick={reset}>Clear</button>{/if}
    {#if outputs > 0 && !processing}
      <button class="btn" onclick={downloadZip}>Download all (ZIP)</button>
      {#if hasFS}<button class="btn ghost" onclick={saveToFolder}>Save all to folder…</button>{/if}
    {/if}
  </div>

  {#if processing}<div class="bar"><div style="width:{(done / queue.length) * 100}%"></div></div>{/if}

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
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  label { display: block; font-size: 13px; color: var(--muted); font-weight: 600; }
  input[type=number], input[type=text] { width: 100%; margin-top: 5px; background: #0f1218;
    border: 1px solid var(--line); color: var(--text); border-radius: 8px; padding: 9px 10px; font-size: 14px; }
  .opts { margin-top: 16px; }
  .check { display: flex; align-items: center; gap: 8px; margin-top: 14px; color: var(--text); font-weight: 500; }
  .check input { width: auto; }
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
