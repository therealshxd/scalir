// Browser/Web-Worker codecs backed by jSquash WASM (MozJPEG, libwebp, libpng)
// and libheif-js for HEIC/HEIF input. Not used in unit tests (mock codecs only).
import { decode as decodeJpeg, encode as encodeJpeg } from '@jsquash/jpeg';
import { decode as decodePng, encode as encodePng } from '@jsquash/png';
import { decode as decodeWebp, encode as encodeWebp } from '@jsquash/webp';
import resizeImage from '@jsquash/resize';
import type { Codecs, Fmt, InputFmt, ImageDataLike } from './types';

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

// Lazy-loaded libheif instance — only initialised when a HEIC file is processed.
let _libheif: any = null;
async function getLibheif() {
  if (!_libheif) {
    const mod = await import('libheif-js/libheif-wasm/libheif-bundle.mjs');
    const factory = mod.default as (...args: any[]) => any;
    const result = factory();
    _libheif = (result && typeof result.then === 'function') ? await result : result;
  }
  return _libheif;
}

// AVIF (@jsquash/avif) is a heavy WASM codec — load it lazily, only when an AVIF
// file is decoded or AVIF output is selected, so it stays out of the initial bundle.
let _avif: typeof import('@jsquash/avif') | null = null;
async function getAvif() {
  if (!_avif) _avif = await import('@jsquash/avif');
  return _avif;
}

// TIFF has no jSquash codec and browsers can't decode it natively — use utif2.
async function decodeTiff(bytes: Uint8Array): Promise<ImageDataLike> {
  const UTIF = await import('utif2');
  const ab = toArrayBuffer(bytes);
  const ifds = UTIF.decode(ab);
  if (!ifds?.length) throw new Error('no images found in TIFF file');
  const ifd = ifds[0];
  UTIF.decodeImage(ab, ifd);
  const rgba = UTIF.toRGBA8(ifd); // Uint8Array, RGBA
  return { data: new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength), width: ifd.width, height: ifd.height };
}

// GIF and BMP have no jSquash codec, but every browser decodes them natively.
// createImageBitmap + OffscreenCanvas work inside Web Workers and read the first
// frame of an animated GIF automatically.
async function decodeNative(bytes: Uint8Array, mime: string): Promise<ImageDataLike> {
  const blob = new Blob([toArrayBuffer(bytes)], { type: mime });
  const bmp = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bmp.width, bmp.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable');
  ctx.drawImage(bmp, 0, 0);
  const id = ctx.getImageData(0, 0, bmp.width, bmp.height);
  bmp.close();
  return { data: id.data, width: id.width, height: id.height };
}

async function decodeHeic(bytes: Uint8Array): Promise<ImageDataLike> {
  const libheif = await getLibheif();
  const decoder = new libheif.HeifDecoder();
  const images: any[] = decoder.decode(bytes);
  if (!images?.length) throw new Error('no images found in HEIC file');
  const img = images[0];
  const w: number = img.get_width();
  const h: number = img.get_height();
  return new Promise((resolve, reject) => {
    const out: ImageDataLike = { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
    img.display(out, (result: ImageDataLike | null) => {
      if (!result) reject(new Error('HEIC render failed'));
      else resolve(result);
    });
  });
}

export const jsquashCodecs: Codecs = {
  async decode(fmt: InputFmt, bytes: Uint8Array): Promise<ImageDataLike> {
    if (fmt === 'heic') return decodeHeic(bytes);
    if (fmt === 'tiff') return decodeTiff(bytes);
    if (fmt === 'gif') return decodeNative(bytes, 'image/gif');
    if (fmt === 'bmp') return decodeNative(bytes, 'image/bmp');
    const ab = toArrayBuffer(bytes);
    if (fmt === 'avif') {
      const out = await (await getAvif()).decode(ab);
      if (!out) throw new Error('AVIF decode failed');
      return out as ImageDataLike;
    }
    const img =
      fmt === 'jpeg' ? await decodeJpeg(ab) :
      fmt === 'png' ? await decodePng(ab) :
      await decodeWebp(ab);
    return img as ImageDataLike;
  },

  async encode(fmt: Fmt, image: ImageDataLike, quality: number): Promise<Uint8Array> {
    const data = image as unknown as ImageData;
    let ab: ArrayBuffer;
    if (fmt === 'jpeg') ab = await encodeJpeg(data, { quality });
    else if (fmt === 'webp') ab = await encodeWebp(data, { quality });
    else if (fmt === 'avif') ab = await (await getAvif()).encode(data, { quality });
    else ab = await encodePng(data); // PNG is lossless; quality ignored
    return new Uint8Array(ab);
  },

  async resize(image: ImageDataLike, width: number, height: number): Promise<ImageDataLike> {
    const out = await resizeImage(image as unknown as ImageData, {
      width,
      height,
      method: 'lanczos3', // high-quality downscaling, like the prototype's LANCZOS
    });
    return out as ImageDataLike;
  },
};
