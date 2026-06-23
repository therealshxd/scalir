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
    const ab = toArrayBuffer(bytes);
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
