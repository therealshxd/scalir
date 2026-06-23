/// <reference lib="webworker" />
// Runs the image-optimisation engine off the main thread so the UI stays
// responsive and rows can paint one-by-one. jSquash's WASM decode/encode is
// CPU-heavy; keeping it here means the tab never freezes during a batch.
import { optimise } from '../core/optimise';
import { jsquashCodecs } from '../core/codecs';
import type { Options, OptimiseResult } from '../core/types';

export type WorkerRequest = {
  id: number;
  name: string;
  bytes: Uint8Array;
  opts: Partial<Options>;
};

export type WorkerResponse = { id: number; result: OptimiseResult };

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, name, bytes, opts } = e.data;
  let result: OptimiseResult;
  try {
    result = await optimise(name, bytes, jsquashCodecs, opts);
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
