<script lang="ts">
  import { untrack } from 'svelte';
  import type { Options, OptimiseResult } from '../core/types';
  import { detectFormat, fmtFromMime } from '../core/rules';
  import { WorkerPool } from './workerPool';

  type Queued = { name: string; bytes: Uint8Array; size: number };

  interface Props {
    item: Queued;                          // the original queued image (before)
    // The "after" to seed with. Present when opened from an already-optimised row; absent when
    // opened as a pre-batch preview of a still-queued image — then we compute it from baseOpts.
    result?: OptimiseResult;
    baseOpts: Partial<Options>;            // the same submit-map run() builds, minus fixedQuality
    onApplyImage: (r: OptimiseResult, quality: number) => void; // commit just this image's result
    onOptimiseBatch: () => void;           // run the normal size-target batch over everything
    onClose: () => void;                   // discard + close
  }
  let { item, result, baseOpts, onApplyImage, onOptimiseBatch, onClose }: Props = $props();

  const kb = (n: number) => (n / 1024).toFixed(1) + ' KB';

  const MIME: Record<string, string> = {
    jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    avif: 'image/avif', gif: 'image/gif', bmp: 'image/bmp',
  };

  // The baseline "after": the passed-in batch result, or computed once on mount from current
  // settings when previewing a queued image. `tweaked` overrides it after a quality drag.
  // `untrack` makes the seed-once intent explicit — baseline is then owned/mutated locally.
  let baseline = $state<OptimiseResult | null>(untrack(() => result) ?? null);
  let computing = $state(false);
  let tweaked = $state<OptimiseResult | null>(null);
  let displayResult = $derived(tweaked ?? baseline);
  let ready = $derived(!!baseline);

  // Re-encode in the baseline's output format so the compare varies only quality, never format.
  let pinnedFmt = $derived(baseline ? fmtFromMime(baseline.outType) : 'webp');
  let fmtLabel = $derived(pinnedFmt.toUpperCase());
  let qualityDisabled = $derived(pinnedFmt === 'png'); // PNG is lossless — no quality knob

  // The "before": use the original bytes directly when the browser can render them; HEIC/TIFF
  // can't go in an <img>, so ask the worker to decode them to a display-capped PNG.
  let inFmt = $derived(detectFormat(item.name, item.bytes));
  let needsDecode = $derived(inFmt === 'heic' || inFmt === 'tiff' || inFmt === null);
  let nativeMime = $derived((inFmt && MIME[inFmt]) || 'image/png');

  let ow = $derived(baseline ? baseline.origDims[0] : 0);
  let oh = $derived(baseline ? baseline.origDims[1] : 0);
  let aspect = $derived(ow > 0 && oh > 0 ? `${ow} / ${oh}` : '4 / 3');

  let divider = $state(50);       // wipe position, 0–100 %
  let quality = $state(80);       // chosen re-encode quality
  let busy = $state(false);
  let beforeUrl = $state('');
  let afterUrl = $state('');

  // Zoom + pan for inspecting artefacts. Both before/after share one transform so they stay aligned.
  let zoom = $state(1);           // 1–2 (100–200%)
  let panX = $state(0);
  let panY = $state(0);
  let frameW = $state(0);
  let frameH = $state(0);
  let xform = $derived(`translate(${panX}px, ${panY}px) scale(${zoom})`);

  let frameEl: HTMLDivElement;
  let pool: WorkerPool | null = null;

  // Session worker + the "before" image + (if needed) the computed baseline, scoped to the modal.
  $effect(() => {
    const p = new WorkerPool(1);
    pool = p;
    let cancelled = false;
    const urls: string[] = [];
    (async () => {
      if (needsDecode) {
        const r = await p.submit({ name: item.name, bytes: item.bytes, opts: {}, mode: 'preview' });
        if (!cancelled && r?.outBytes) {
          const u = URL.createObjectURL(new Blob([r.outBytes as BlobPart], { type: 'image/png' }));
          urls.push(u); beforeUrl = u;
        }
      } else {
        const u = URL.createObjectURL(new Blob([item.bytes as BlobPart], { type: nativeMime }));
        urls.push(u); beforeUrl = u;
      }
      // Pre-batch preview: no seeded result, so optimise this one image with current settings.
      if (!untrack(() => baseline) && !cancelled) {
        computing = true;
        const r = await p.submit({ name: item.name, bytes: item.bytes, opts: baseOpts });
        if (!cancelled && r) baseline = r;
        computing = false;
      }
    })();
    return () => {
      cancelled = true;
      p.terminate();
      pool = null;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  });

  // The "after" image follows whatever result is currently displayed (baseline or tweaked).
  $effect(() => {
    const dr = displayResult;
    if (!dr?.outBytes) { afterUrl = ''; return; }
    const url = URL.createObjectURL(new Blob([dr.outBytes as BlobPart], { type: dr.outType }));
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

  function reset() { tweaked = null; quality = 80; divider = 50; resetView(); }

  // ── Zoom / pan ────────────────────────────────────────────────────────────
  function clampPan() {
    const minX = -(zoom - 1) * frameW;
    const minY = -(zoom - 1) * frameH;
    panX = Math.min(0, Math.max(minX, panX));
    panY = Math.min(0, Math.max(minY, panY));
  }
  function setZoom(z: number) {
    zoom = Math.max(1, Math.min(2, Math.round(z * 100) / 100));
    if (zoom === 1) { panX = 0; panY = 0; } else clampPan();
  }
  function resetView() { zoom = 1; panX = 0; panY = 0; }
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    setZoom(zoom + (e.deltaY < 0 ? 0.2 : -0.2));
  }

  // Divider wipe drag (screen space).
  function moveDivider(clientX: number) {
    if (!frameEl) return;
    const rect = frameEl.getBoundingClientRect();
    divider = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }
  let draggingDivider = false;
  function onDividerDown(e: PointerEvent) {
    e.stopPropagation();               // don't also start a frame pan
    draggingDivider = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    moveDivider(e.clientX);
  }
  function onDividerMove(e: PointerEvent) { if (draggingDivider) moveDivider(e.clientX); }
  function onDividerUp() { draggingDivider = false; }

  // Pan the zoomed image by dragging the frame background (only meaningful when zoomed in).
  let panning = false, sx = 0, sy = 0, spx = 0, spy = 0;
  function onFrameDown(e: PointerEvent) {
    if (zoom <= 1) return;
    panning = true; sx = e.clientX; sy = e.clientY; spx = panX; spy = panY;
    frameEl.setPointerCapture(e.pointerId);
  }
  function onFrameMove(e: PointerEvent) {
    if (!panning) return;
    panX = spx + (e.clientX - sx); panY = spy + (e.clientY - sy);
    clampPan();
  }
  function onFrameUp() { panning = false; }

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

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="cmp-frame" class:pan={zoom > 1} style="aspect-ratio: {aspect};"
      bind:this={frameEl} bind:clientWidth={frameW} bind:clientHeight={frameH}
      onpointerdown={onFrameDown} onpointermove={onFrameMove} onpointerup={onFrameUp}
      onpointercancel={onFrameUp} onwheel={onWheel}>
      {#if beforeUrl}
        <img class="cmp-img" src={beforeUrl} alt="Original" draggable="false" style="transform: {xform};" />
      {:else}
        <div class="cmp-loading">Loading preview…</div>
      {/if}
      {#if afterUrl}
        <div class="cmp-clip" style="width: {divider}%;">
          <img class="cmp-img cmp-after" src={afterUrl} alt="Optimised" draggable="false"
            style="width: {frameW}px; transform: {xform};" />
        </div>
      {:else if beforeUrl && computing}
        <div class="cmp-loading cmp-computing">Computing preview…</div>
      {/if}

      <span class="cmp-tag cmp-tag-l">Original</span>
      <span class="cmp-tag cmp-tag-r">{ready ? 'Optimised' : 'Preview'}{busy ? ' · …' : ''}</span>

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="cmp-divider" style="left: {divider}%;"
        onpointerdown={onDividerDown} onpointermove={onDividerMove} onpointerup={onDividerUp}>
        <span class="cmp-handle" aria-hidden="true"></span>
      </div>
    </div>

    <div class="cmp-zoom">
      <button class="cmp-zbtn" aria-label="Zoom out" disabled={zoom <= 1} onclick={() => setZoom(zoom - 0.25)}>−</button>
      <span class="cmp-zval">{Math.round(zoom * 100)}%</span>
      <button class="cmp-zbtn" aria-label="Zoom in" disabled={zoom >= 2} onclick={() => setZoom(zoom + 0.25)}>+</button>
      <button class="cmp-zreset" disabled={zoom === 1 && panX === 0 && panY === 0} onclick={resetView}>Reset view</button>
      <span class="cmp-zhint">{zoom > 1 ? 'Drag to pan' : 'Scroll or + to zoom to 200%'}</span>
    </div>

    <div class="cmp-meta">
      <span>{kb(item.size)}{#if ow} · {ow}×{oh}{/if}</span>
      {#if displayResult}
        <span>{kb(displayResult.newBytes)} · {displayResult.newDims[0]}×{displayResult.newDims[1]} · {fmtLabel}</span>
      {:else}
        <span>Computing…</span>
      {/if}
    </div>

    <div class="cmp-controls">
      {#if qualityDisabled}
        <p class="cmp-note">PNG is lossless — quality can't be adjusted. Switch this image's format in Settings to re-encode.</p>
      {:else}
        <label class="cmp-qlabel" for="cmp-q">Quality</label>
        <div class="cmp-slider">
          <input id="cmp-q" type="range" min="1" max="100" step="1" bind:value={quality} oninput={onQualityInput} disabled={!ready} />
          <input class="cmp-num" type="number" min="1" max="100" bind:value={quality} oninput={onQualityInput} disabled={!ready} />
        </div>
        <span class="cmp-hint">Re-encodes just this image at a fixed quality, ignoring the size cap. Use “Optimise this image” to keep it; “Optimise whole batch” runs the normal size-target compression over every image.</span>
      {/if}
    </div>

    <div class="cmp-actions">
      <button class="cmp-btn primary" disabled={!displayResult || busy || computing} onclick={() => onApplyImage(displayResult!, quality)}>Optimise this image</button>
      <button class="cmp-btn" onclick={onOptimiseBatch}>Optimise whole batch</button>
      <button class="cmp-btn ghost" disabled={!tweaked && zoom === 1} onclick={reset}>Reset</button>
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
  .cmp-frame.pan { cursor: grab; }
  .cmp-frame.pan:active { cursor: grabbing; }
  .cmp-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain;
    transform-origin: 0 0; }
  /* Screen-space reveal: the clip container is sized to the divider; the inner after-image is
     pinned to the full frame width so it stays pixel-aligned with the before image under zoom. */
  .cmp-clip { position: absolute; top: 0; bottom: 0; left: 0; overflow: hidden; z-index: 1; }
  .cmp-clip .cmp-after { position: absolute; top: 0; left: 0; height: 100%; inset: auto; }
  .cmp-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    color: var(--muted); font-size: 13px; }
  .cmp-computing { z-index: 1; }

  .cmp-tag { position: absolute; top: 8px; z-index: 2; font-size: 11px; font-weight: 700;
    padding: 3px 8px; border-radius: 20px; background: rgba(4, 6, 10, .6); color: #fff; pointer-events: none; }
  .cmp-tag-l { left: 8px; }
  .cmp-tag-r { right: 8px; }

  .cmp-divider { position: absolute; top: 0; bottom: 0; z-index: 3; width: 2px; margin-left: -1px;
    background: var(--accent); cursor: ew-resize; }
  .cmp-handle { position: absolute; top: 50%; left: 50%; width: 26px; height: 26px; transform: translate(-50%, -50%);
    border-radius: 50%; background: var(--accent); border: 2px solid #fff; box-shadow: 0 1px 6px rgba(0,0,0,.5); }

  .cmp-zoom { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
  .cmp-zbtn { width: 30px; height: 30px; flex: none; border-radius: 8px; border: 1px solid var(--line);
    background: #0f1218; color: var(--text); font-size: 17px; line-height: 1; cursor: pointer;
    transition: border-color .12s, color .12s; }
  .cmp-zbtn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .cmp-zval { min-width: 46px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text); }
  .cmp-zreset { background: transparent; border: 1px solid var(--line); color: var(--muted);
    border-radius: 8px; padding: 6px 10px; font-size: 12.5px; cursor: pointer; transition: border-color .12s, color .12s; }
  .cmp-zreset:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .cmp-zbtn:disabled, .cmp-zreset:disabled { opacity: .4; cursor: default; }
  .cmp-zhint { font-size: 11.5px; color: var(--muted); margin-left: auto; }

  .cmp-meta { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px;
    font-size: 12.5px; color: var(--muted); }
  .cmp-meta span:last-child { color: var(--text); font-weight: 600; text-align: right; }

  .cmp-controls { margin-top: 14px; }
  .cmp-qlabel { display: block; font-size: 13px; font-weight: 600; color: var(--muted); }
  .cmp-slider { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
  .cmp-slider input[type=range] { flex: 1; margin: 0; accent-color: var(--accent); }
  .cmp-slider input:disabled { opacity: .5; }
  .cmp-num { width: 72px; flex: none; background: #0f1218; border: 1px solid var(--line);
    color: var(--text); border-radius: 8px; padding: 8px 10px; font-size: 14px; }
  .cmp-hint { display: block; margin-top: 6px; font-size: 11.5px; color: var(--muted); line-height: 1.4; }
  .cmp-note { margin: 0; font-size: 12.5px; color: var(--muted); }

  .cmp-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
  .cmp-btn { border: 1px solid var(--line); border-radius: 9px; padding: 10px 16px; font-size: 14px;
    font-weight: 600; cursor: pointer; background: #0f1218; color: var(--text); transition: border-color .12s; }
  .cmp-btn:hover:not(:disabled) { border-color: var(--accent); }
  .cmp-btn.primary { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
  .cmp-btn.ghost { background: transparent; color: var(--accent); border: 1px solid var(--accent); }
  .cmp-btn:disabled { opacity: .45; cursor: default; }

  @media (max-width: 560px) {
    .cmp-meta { flex-direction: column; gap: 2px; }
    .cmp-meta span:last-child { text-align: left; }
    .cmp-zhint { display: none; }
  }
</style>
