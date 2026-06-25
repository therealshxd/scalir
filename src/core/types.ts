// Core types for the image-optimisation engine.
// The engine is framework-agnostic and depends only on a Codecs interface,
// so it can run in the browser (jSquash) or under test (mock codecs).

export type Fmt = 'jpeg' | 'png' | 'webp';
export type InputFmt = Fmt | 'heic';

export interface ImageDataLike {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface Codecs {
  decode(fmt: InputFmt, bytes: Uint8Array): Promise<ImageDataLike>;
  encode(fmt: Fmt, image: ImageDataLike, quality: number): Promise<Uint8Array>;
  resize(image: ImageDataLike, width: number, height: number): Promise<ImageDataLike>;
}

export type OutputFormat = 'auto' | Fmt;

export interface Options {
  maxDim: number;        // longest-side cap in px (default 2000)
  maxBytes: number;      // file-size cap in bytes (default 1 MB)
  prefix: string;        // output filename prefix (default 'scaled_')
  allowWebp: boolean;    // may convert to WebP to hit the size cap (auto only)
  qualityFloor: number;  // never encode below this quality
  webpAdvantage: number; // WebP must be < this fraction of the alt to switch
  outputFormat: OutputFormat; // 'auto' keeps original (opportunistic WebP); else force
}

export const DEFAULT_OPTIONS: Options = {
  maxDim: 2000,
  maxBytes: 1024 * 1024,
  prefix: 'scaled_',
  allowWebp: true,
  qualityFloor: 60,
  webpAdvantage: 0.9,
  outputFormat: 'auto',
};

export interface OptimiseResult {
  name: string;
  outName: string;
  status: 'ok' | 'skipped' | 'error';
  action: string;
  resized: boolean;
  compressed: boolean;
  converted: boolean;
  origDims: [number, number];
  newDims: [number, number];
  origBytes: number;
  newBytes: number;
  outBytes?: Uint8Array;
  outType: string; // MIME type of the output
  message: string;
}
