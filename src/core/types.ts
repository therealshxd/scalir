// Core types for the image-optimisation engine.
// The engine is framework-agnostic and depends only on a Codecs interface,
// so it can run in the browser (jSquash) or under test (mock codecs).

export type Fmt = 'jpeg' | 'png' | 'webp' | 'avif';            // encodable outputs
export type InputFmt = Fmt | 'heic' | 'gif' | 'tiff' | 'bmp';  // + decode-only inputs

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

export type ResizeMode = 'longest' | 'width' | 'height' | 'percent';

export interface Options {
  resizeMode: ResizeMode; // how maxDim/targetW/targetH/percent are interpreted (default 'longest')
  maxDim: number;        // longest-side cap in px (default 2000) — used by 'longest'
  targetW: number;       // exact output width in px — used by 'width'
  targetH: number;       // exact output height in px — used by 'height'
  percent: number;       // scale % (1–100) — used by 'percent'
  maxBytes: number;      // file-size cap in bytes (default 1 MB)
  prefix: string;        // output filename prefix (default 'scaled_')
  rename: string;        // replaces the original base name when non-empty (default '')
  suffix: string;        // output filename suffix, before the extension (default '')
  lowercase: boolean;    // lower-case the output filename
  slugify: boolean;      // spaces → dashes and strip unsafe characters
  allowWebp: boolean;    // may convert to WebP to hit the size cap (auto only)
  qualityFloor: number;  // never encode below this quality
  webpAdvantage: number; // WebP must be < this fraction of the alt to switch
  outputFormat: OutputFormat; // 'auto' keeps original (opportunistic WebP); else force
  fixedQuality?: number; // per-image compare override: encode once at exactly this quality,
                         // ignoring maxBytes (WYSIWYG). Absent = normal size-targeting flow.
}

export const DEFAULT_OPTIONS: Options = {
  resizeMode: 'longest',
  maxDim: 2000,
  targetW: 1920,
  targetH: 1080,
  percent: 50,
  maxBytes: 1024 * 1024,
  prefix: 'scaled_',
  rename: '',
  suffix: '',
  lowercase: false,
  slugify: false,
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
  copied?: boolean; // emitted the original bytes unchanged (already within both caps)
  origDims: [number, number];
  newDims: [number, number];
  origBytes: number;
  newBytes: number;
  outBytes?: Uint8Array;
  outType: string; // MIME type of the output
  message: string;
}
