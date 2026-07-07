/// <reference lib="webworker" />
// Runs the image-optimisation engine off the main thread so the UI stays
// responsive and rows can paint one-by-one. jSquash's WASM decode/encode is
// CPU-heavy; keeping it here means the tab never freezes during a batch.
import { optimise } from '../core/optimise';
import { detectFormat, computeResize } from '../core/rules';
import { jsquashCodecs } from '../core/codecs';
import type { Options, OptimiseResult } from '../core/types';

export type WorkerRequest = {
  id: number;
  name: string;
  bytes: Uint8Array;
  opts: Partial<Options>;
  // 'preview' decodes any input (incl. HEIC/TIFF/BMP) to a display-capped PNG so the compare
  // view can render a "before" for formats a browser can't put in an <img> directly.
  mode?: 'preview';
};

export type WorkerResponse = { id: number; result: OptimiseResult };

// Longest-side cap for the on-screen "before" preview — plenty for a compare frame, and keeps
// the throwaway PNG small even for a 48-megapixel source.
const PREVIEW_MAX = 1600;

/** Decode + downscale-to-fit + PNG-encode, purely to get browser-renderable bytes for display. */
async function preview(name: string, bytes: Uint8Array): Promise<OptimiseResult> {
  const base: OptimiseResult = {
    name, outName: '', status: 'ok', action: 'preview', resized: false, compressed: false,
    converted: false, origDims: [0, 0], newDims: [0, 0], origBytes: bytes.length, newBytes: 0,
    outType: '', message: '',
  };
  const fmt = detectFormat(name, bytes);
  if (!fmt) { base.status = 'skipped'; base.message = 'unsupported format'; return base; }
  let img = await jsquashCodecs.decode(fmt, bytes);
  base.origDims = [img.width, img.height];
  const target = computeResize(img.width, img.height, {
    resizeMode: 'longest', maxDim: PREVIEW_MAX, targetW: 0, targetH: 0, percent: 100,
  });
  if (target) img = await jsquashCodecs.resize(img, target[0], target[1]);
  const png = await jsquashCodecs.encode('png', img, 100);
  base.newDims = [img.width, img.height];
  base.outBytes = png;
  base.newBytes = png.length;
  base.outType = 'image/png';
  return base;
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, name, bytes, opts, mode } = e.data;
  let result: OptimiseResult;
  try {
    result = mode === 'preview'
      ? await preview(name, bytes)
      : await optimise(name, bytes, jsquashCodecs, opts);
  } catch (err: any) {
    // optimise() handles decode failures internally, but guard encode/resize
    // throws here so one bad image can't kill the worker mid-batch.
    result = {
      name, outName: '', status: 'error', action: '', resized: false,
      compressed: false, converted: false, origDims: [0, 0], newDims: [0, 0],
      origBytes: bytes.length, newBytes: 0, outType: '',
      message: String(err?.message ?? err),
    };
  }
  // Transfer the output buffer back to avoid copying the encoded image.
  const transfer = result.outBytes ? [result.outBytes.buffer] : [];
  (self as DedicatedWorkerGlobalScope).postMessage({ id, result } satisfies WorkerResponse, transfer);
};
