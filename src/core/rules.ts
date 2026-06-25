import type { Fmt, InputFmt, ImageDataLike } from './types';

export const SUPPORTED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
export const QUALITY_LADDER = [95, 90, 85, 80, 75, 70, 65, 60];

export function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

/** Detect format from magic bytes first, then file extension. */
export function detectFormat(name: string, bytes: Uint8Array): InputFmt | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50) return 'png';
  if (
    bytes.length >= 12 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // "WEBP"
  ) return 'webp';
  // HEIC/HEIF: ISO Base Media File Format — bytes 4-7 are 'ftyp' box type
  if (
    bytes.length >= 8 &&
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70 // 'ftyp'
  ) return 'heic';
  const e = extOf(name);
  if (e === 'jpg' || e === 'jpeg') return 'jpeg';
  if (e === 'png') return 'png';
  if (e === 'webp') return 'webp';
  if (e === 'heic' || e === 'heif') return 'heic';
  return null;
}

/** Returns [w,h] to resize to, or null if already within the cap. Aspect kept. */
export function resizeTarget(w: number, h: number, maxDim: number): [number, number] | null {
  if (Math.max(w, h) <= maxDim) return null;
  const s = maxDim / Math.max(w, h);
  return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))];
}

export function qualitySteps(floor: number): number[] {
  const s = QUALITY_LADDER.filter((q) => q >= floor);
  return s.length ? s : [floor];
}

/**
 * Find the highest quality in [floor, ceil] whose encode is <= maxBytes and return
 * its bytes — i.e. the best-looking result that still fits under the cap. Uses a
 * binary search (~7 encodes for the default 55-95 range), which lands much closer to
 * the target than stepping the coarse QUALITY_LADDER. If nothing fits (or floor>ceil),
 * returns the floor encode so the qualityFloor is always honoured.
 */
export async function bestQualityUnder(
  encode: (q: number) => Promise<Uint8Array>,
  floor: number,
  ceil: number,
  maxBytes: number,
): Promise<Uint8Array> {
  let lo = floor;
  let hi = ceil;
  let best: Uint8Array | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const enc = await encode(mid);
    if (enc.length <= maxBytes) {
      best = enc;      // fits — try to do better (higher quality)
      lo = mid + 1;
    } else {
      hi = mid - 1;    // too big — drop quality
    }
  }
  return best ?? (await encode(floor));
}

/** True if any pixel has alpha < 255. */
export function hasAlpha(img: ImageDataLike): boolean {
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 255) return true;
  return false;
}

export function mimeOf(f: Fmt): string {
  return f === 'jpeg' ? 'image/jpeg' : f === 'png' ? 'image/png' : 'image/webp';
}

export function extForFmt(f: Fmt): string {
  return f === 'jpeg' ? '.jpg' : f === 'png' ? '.png' : '.webp';
}
