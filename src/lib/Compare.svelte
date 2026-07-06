<script lang="ts">
  import type { Options, OptimiseResult } from '../core/types';
  import { detectFormat, fmtFromMime } from '../core/rules';
  import { WorkerPool } from './workerPool';

  type Queued = { name: string; bytes: Uint8Array; size: number };

  interface Props {
    item: Queued;                         // the original queued image (before)
    result: OptimiseResult;               // the batch result for this image (after)
    baseOpts: Partial<Options>;                        // the same submit-map run() builds, minus fixedQuality
    onApply: (r: OptimiseResult, quality: number) => void; // swap a tweaked result into the batch
    onClose: () => void;                               // discard + close
  }
  let { item, result, baseOpts, onApply, onClose }: Props = $props();

  const kb = (n: number) => (n / 1024).toFixed(1) + ' KB';

  const MIME: Record<string, string> = {
    jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    avif: 'image/avif', gif: 'image/gif', bmp: 'image/bmp',
  };

  // Re-encode in the batch's output format so the compare varies only quality, never format.
  let pinnedFmt = $derived(fmtFromMime(result.outType));
  let fmtLabel = $derived(pinnedFmt.toUpperCase());
  let qualityDisabled = $derived(pinnedFmt === 'png'); // PNG is lossless — no quality knob

  // The "before": use the original bytes directly when the browser can render them; HEIC/TIFF
  // can't go in an <img>, so ask the worker to decode them to a display-capped PNG.
  let inFmt = $derived(detectFormat(item.name, item.bytes));
  let needsDecode = $derived(inFmt === 'heic' || inFmt === 'tiff' || inFmt === null);
  let nativeMime = $derived((inFmt && MIME[inFmt]) || 'image/png');

  let ow = $derived(result.origDims[0]);
  let oh = $derived(result.origDims[1]);
  let aspect = $derived(ow > 0 && oh > 0 ? `${ow} / ${oh}` : '4 / 3');

  let divider = $state(50);       // wipe position, 0–100 %
  let quality = $state(80);       // chosen re-encode quality
  let tweaked = $state<OptimiseResult | null>(null); // latest re-encode, or null = show batch output
  let busy = $state(false);
  let beforeUrl = $state('');
  let afterUrl = $state('');
  let frameEl: HTMLDivElement;

  let displayResult = $derived(tweaked ?? result);
  const canApply = $derived(!!tweaked);

  let pool: WorkerPool | null = null;

  // Session worker + the "before" image, both scoped to the modal's lifetime.
  $effect(() => {
    const p = new WorkerPool(1);
    pool = p;
    let url = '';
    let cancelled = false;
    (async () => {
      if (needsDecode) {
        const r = await p.submit({ name: item.name, bytes: item.bytes, opts: {}, mode: 'preview' });
        if (!cancelled && r?.outBytes) {
          url = URL.createObjectURL(new Blob([r.outBytes as BlobPart], { type: 'image/png' }));
          beforeUrl = url;
        }
      } else {
        url = URL.createObjectURL(new Blob([item.bytes as BlobPart], { type: nativeMime }));
        beforeUrl = url;
      }
    })();
    return () => {
      cancelled = true;
      p.terminate();
      pool = null;
      if (url) URL.revokeObjectURL(url);
    };
  });

  // The "after" image follows whatever result is currently displayed (batch or tweaked).
  $effect(() => {
    const bytes = displayResult.outBytes;
    if (!bytes) { afterUrl = ''; return; }
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: displayResult.outType }));
    afterUrl = url;
    return () => URL.revokeObjectURL(url);
  });

  // Debounced, latest-wins re-encode of just this image at the chosen quality.
  let reqSeq = 0;
  let timer: ReturnType<typeof setTimeout>;
  function onQualityInput() {
    if (qualityDisabled) return;
    clearTimeout(timer);
    timer = setTimeout(reencode, 200);
  }
  async function reencode() {
    if (qualityDisabled || !pool) return;
    const mine = ++reqSeq;
    busy = true;
    const r = await pool.submit({
      name: item.name,
      bytes: item.bytes,
      opts: { ...baseOpts, fixedQuality: quality, outputFormat: pinnedFmt },
    });
    if (mine !== reqSeq) return;         // superseded by a newer drag
    busy = false;
    if (r) tweaked = r;
  }

  function reset() { tweaked = null; quality = 80; divider = 50; }
  function moveTo(clientX: number) {
    if (!frameEl) return;
    const rect = frameEl.getBoundingClientRect();
    divider = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }
  let dragging = false;
  function onPointerDown(e: PointerEvent) {
    dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    moveTo(e.clientX);
  }
  function onPointerMove(e: PointerEvent) { if (dragging) moveTo(e.clientX); }
  function onPointerUp() { dragging = false; }

  function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
</script>

<svelte:window onkeydown={onKey} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="cmp-backdrop" onclick={onClose}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="cmp-dialog" role="dialog" aria-modal="true" tabindex="-1" aria-label="Compare original and optimised" onclick={(e) => e.stopPropagation()}>
    <div class="cmp-head">
      <span class="cmp-title">{item.name}</span>
      <button class="cmp-x" aria-label="Close" onclick={onClose}>×</button>
    </div>

    <div class="cmp-frame" style="aspect-ratio: {aspect};" bind:this={frameEl}>
      {#if beforeUrl}
        <img class="cmp-img" src={beforeUrl} alt="Original" draggable="false" />
      {:else}
        <div class="cmp-loading">Loading preview…</div>
      {/if}
      {#if afterUrl}
        <img class="cmp-img cmp-after" src={afterUrl} alt="Optimised" draggable="false"
          style="clip-path: inset(0 0 0 {divider}%);" />
      {/if}

      <span class="cmp-tag cmp-tag-l">Original</span>
      <span class="cmp-tag cmp-tag-r">Optimised{busy ? ' · …' : ''}</span>

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="cmp-divider" style="left: {divider}%;"
        onpointerdown={onPointerDown} onpointermove={onPointerMove} onpointerup={onPointerUp}>
        <span class="cmp-handle" aria-hidden="true"></span>
      </div>
    </div>

    <div class="cmp-meta">
      <span>{kb(item.size)} · {ow}×{oh}</span>
      <span>{kb(displayResult.newBytes)} · {displayResult.newDims[0]}×{displayResult.newDims[1]} · {fmtLabel}</span>
    </div>

    <div class="cmp-controls">
      {#if qualityDisabled}
        <p class="cmp-note">PNG is lossless — quality can't be adjusted. Switch this image's format in Settings to re-encode.</p>
      {:else}
        <label class="cmp-qlabel" for="cmp-q">Quality</label>
        <div class="cmp-slider">
          <input id="cmp-q" type="range" min="1" max="100" step="1" bind:value={quality} oninput={onQualityInput} />
          <input class="cmp-num" type="number" min="1" max="100" bind:value={quality} oninput={onQualityInput} />
        </div>
        <span class="cmp-hint">Re-encodes just this image at a fixed quality, ignoring the batch size cap. The batch result is shown until you adjust.</span>
      {/if}
    </div>

    <div class="cmp-actions">
      <button class="cmp-btn primary" disabled={!canApply || busy} onclick={() => onApply(tweaked ?? result, quality)}>Apply to batch</button>
      <button class="cmp-btn ghost" disabled={!canApply} onclick={reset}>Reset</button>
      <button class="cmp-btn ghost" onclick={onClose}>Close</button>
    </div>
  </div>
</div>

<style>
  .cmp-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(4, 6, 10, .72);
    display: flex; align-items: center; justify-content: center; padding: 20px; }
  .cmp-dialog { background: var(--panel); border: 1px solid var(--line); border-radius: 16px;
    padding: 18px; width: min(760px, 100%); max-height: 92vh; overflow: auto; }
  .cmp-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
  .cmp-title { font-weight: 700; font-size: 15px; color: var(--text); overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap; }
  .cmp-x { flex: none; width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--line);
    background: #0f1218; color: var(--muted); font-size: 18px; line-height: 1; cursor: pointer;
    transition: color .12s, border-color .12s; }
  .cmp-x:hover { color: var(--text); border-color: var(--accent); }

  .cmp-frame { position: relative; width: 100%; max-height: 62vh; margin: 0 auto; overflow: hidden;
    border-radius: 12px; border: 1px solid var(--line); background: #0f1218;
    background-image: linear-gradient(45deg, #14171d 25%, transparent 25%, transparent 75%, #14171d 75%),
      linear-gradient(45deg, #14171d 25%, transparent 25%, transparent 75%, #14171d 75%);
    background-size: 20px 20px; background-position: 0 0, 10px 10px; /* checkerboard for alpha */
    touch-action: none; user-select: none; }
  .cmp-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
  .cmp-after { z-index: 1; }
  .cmp-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    color: var(--muted); font-size: 13px; }

  .cmp-tag { position: absolute; top: 8px; z-index: 2; font-size: 11px; font-weight: 700;
    padding: 3px 8px; border-radius: 20px; background: rgba(4, 6, 10, .6); color: #fff; pointer-events: none; }
  .cmp-tag-l { left: 8px; }
  .cmp-tag-r { right: 8px; }

  .cmp-divider { position: absolute; top: 0; bottom: 0; z-index: 3; width: 2px; margin-left: -1px;
    background: var(--accent); cursor: ew-resize; }
  .cmp-handle { position: absolute; top: 50%; left: 50%; width: 26px; height: 26px; transform: translate(-50%, -50%);
    border-radius: 50%; background: var(--accent); border: 2px solid #fff; box-shadow: 0 1px 6px rgba(0,0,0,.5); }

  .cmp-meta { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px;
    font-size: 12.5px; color: var(--muted); }
  .cmp-meta span:last-child { color: var(--text); font-weight: 600; text-align: right; }

  .cmp-controls { margin-top: 14px; }
  .cmp-qlabel { display: block; font-size: 13px; font-weight: 600; color: var(--muted); }
  .cmp-slider { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
  .cmp-slider input[type=range] { flex: 1; margin: 0; accent-color: var(--accent); }
  .cmp-num { width: 72px; flex: none; background: #0f1218; border: 1px solid var(--line);
    color: var(--text); border-radius: 8px; padding: 8px 10px; font-size: 14px; }
  .cmp-hint { display: block; margin-top: 6px; font-size: 11.5px; color: var(--muted); line-height: 1.4; }
  .cmp-note { margin: 0; font-size: 12.5px; color: var(--muted); }

  .cmp-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
  .cmp-btn { border: 0; border-radius: 9px; padding: 10px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .cmp-btn.primary { background: var(--accent); color: var(--accent-ink); }
  .cmp-btn.ghost { background: transparent; color: var(--accent); border: 1px solid var(--accent); }
  .cmp-btn:disabled { opacity: .45; cursor: default; }

  @media (max-width: 560px) {
    .cmp-meta { flex-direction: column; gap: 2px; }
    .cmp-meta span:last-child { text-align: left; }
  }
</style>
