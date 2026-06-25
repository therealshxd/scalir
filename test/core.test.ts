import { describe, it, expect } from 'vitest';
import type { Codecs, Fmt, InputFmt, ImageDataLike } from '../src/core/types';
import { optimise } from '../src/core/optimise';
import { detectFormat, resizeTarget, hasAlpha } from '../src/core/rules';
import { makeOutName } from '../src/core/naming';
import { readJpegOrientation, applyOrientation } from '../src/core/exif';

const MB = 1024 * 1024;

function mkImage(w: number, h: number, alpha = 255): ImageDataLike {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = 100; data[i * 4 + 1] = 150; data[i * 4 + 2] = 200; data[i * 4 + 3] = alpha;
  }
  return { data, width: w, height: h };
}

// Mock codecs with a deterministic size model so the ladder/convert logic is testable.
class MockCodecs implements Codecs {
  constructor(public image: ImageDataLike) {}
  async decode(_f: InputFmt, _b: Uint8Array) { return this.image; }
  size(fmt: Fmt, q: number, px: number) {
    if (fmt === 'png') return px * 3;            // lossless: large
    const base = px * (q / 100) * 0.5;           // jpeg
    return Math.round(fmt === 'webp' ? base * 0.4 : base);
  }
  async encode(fmt: Fmt, img: ImageDataLike, q: number) {
    return new Uint8Array(this.size(fmt, q, img.width * img.height));
  }
  async resize(img: ImageDataLike, w: number, h: number) {
    return mkImage(w, h, img.data[3]); // preserve alpha-ness
  }
}

function header(fmt: Fmt | 'heic'): Uint8Array {
  const b = new Uint8Array(32);
  if (fmt === 'jpeg') { b[0] = 0xff; b[1] = 0xd8; b[2] = 0xff; }
  else if (fmt === 'png') { b[0] = 0x89; b[1] = 0x50; }
  else if (fmt === 'webp') { b[8] = 0x57; b[9] = 0x45; b[10] = 0x42; b[11] = 0x50; }
  else {
    // ftyp box: size (4 bytes) + 'ftyp' at offset 4
    b[4] = 0x66; b[5] = 0x74; b[6] = 0x79; b[7] = 0x70;
    // brand 'heic' at offset 8
    b[8] = 0x68; b[9] = 0x65; b[10] = 0x69; b[11] = 0x63;
  }
  return b;
}

describe('rules', () => {
  it('detects format from magic bytes', () => {
    expect(detectFormat('x', header('jpeg'))).toBe('jpeg');
    expect(detectFormat('x', header('png'))).toBe('png');
    expect(detectFormat('x', header('webp'))).toBe('webp');
    expect(detectFormat('x', header('heic'))).toBe('heic');
    expect(detectFormat('x.txt', new Uint8Array([1, 2, 3]))).toBe(null);
  });
  it('detects heic/heif from extension when magic bytes absent', () => {
    const plain = new Uint8Array(32); // no magic bytes
    expect(detectFormat('photo.heic', plain)).toBe('heic');
    expect(detectFormat('photo.heif', plain)).toBe('heic');
  });
  it('resizeTarget keeps aspect, only shrinks', () => {
    expect(resizeTarget(4000, 3000, 2000)).toEqual([2000, 1500]);
    expect(resizeTarget(5000, 1000, 2000)).toEqual([2000, 400]);
    expect(resizeTarget(1500, 1000, 2000)).toBe(null);
  });
});

describe('naming', () => {
  it('keeps extension by default, swaps on convert', () => {
    expect(makeOutName('beach.jpg', 'scaled_', null)).toBe('scaled_beach.jpg');
    expect(makeOutName('beach.jpeg', 'scaled_', null)).toBe('scaled_beach.jpeg');
    expect(makeOutName('logo.png', 'scaled_', '.webp')).toBe('scaled_logo.webp');
  });
});

describe('optimise', () => {
  it('big JPEG, webp disallowed: resizes + steps quality down, stays JPEG, fits', async () => {
    const c = new MockCodecs(mkImage(4000, 3000));
    const r = await optimise('photo.jpg', header('jpeg'), c, { allowWebp: false });
    expect(r.resized).toBe(true);
    expect(r.newDims).toEqual([2000, 1500]);
    expect(r.compressed).toBe(true);
    expect(r.converted).toBe(false);
    expect(r.outName).toBe('scaled_photo.jpg');
    expect(r.newBytes).toBeLessThanOrEqual(MB);
    expect(r.outType).toBe('image/jpeg');
  });

  it('big JPEG, webp allowed: converts to smaller WebP', async () => {
    const c = new MockCodecs(mkImage(4000, 3000));
    const r = await optimise('photo.jpg', header('jpeg'), c, {});
    expect(r.converted).toBe(true);
    expect(r.outName).toBe('scaled_photo.webp');
    expect(r.outType).toBe('image/webp');
    expect(r.newBytes).toBeLessThanOrEqual(MB);
  });

  it('PNG with alpha: converts to WebP (never JPEG), keeps fitting', async () => {
    const c = new MockCodecs(mkImage(2500, 2500, 200));
    const r = await optimise('logo.png', header('png'), c, {});
    expect(r.resized).toBe(true);
    expect(r.converted).toBe(true);
    expect(r.outName).toBe('scaled_logo.webp');
    expect(r.outType).toBe('image/webp');
    expect(r.newBytes).toBeLessThanOrEqual(MB);
  });

  it('PNG, webp disallowed: stays PNG, flags over-limit when it cannot fit', async () => {
    const c = new MockCodecs(mkImage(2500, 2500, 200));
    const r = await optimise('logo.png', header('png'), c, { allowWebp: false });
    expect(r.converted).toBe(false);
    expect(r.outName).toBe('scaled_logo.png');
    expect(r.newBytes).toBeGreaterThan(MB);
    expect(r.message).toMatch(/over size limit/);
  });

  it('small image already within limits: no resize, no compress', async () => {
    const c = new MockCodecs(mkImage(800, 600));
    const r = await optimise('ok.jpg', header('jpeg'), c, {});
    expect(r.resized).toBe(false);
    expect(r.compressed).toBe(false);
    expect(r.converted).toBe(false);
    expect(r.outName).toBe('scaled_ok.jpg');
    expect(r.action).toMatch(/already within limits/);
  });

  it('skips unsupported files', async () => {
    const c = new MockCodecs(mkImage(10, 10));
    const r = await optimise('notes.txt', new Uint8Array([1, 2, 3]), c, {});
    expect(r.status).toBe('skipped');
  });

  it('HEIC input: outputs as JPEG with scaled_ prefix and .jpg extension', async () => {
    const c = new MockCodecs(mkImage(800, 600));
    const r = await optimise('photo.heic', header('heic'), c, {});
    expect(r.status).toBe('ok');
    expect(r.converted).toBe(true);
    expect(r.outName).toBe('scaled_photo.jpg');
    expect(r.outType).toBe('image/jpeg');
  });

  it('HEIC input: large file resizes and compresses, outputs JPEG when WebP disallowed', async () => {
    const c = new MockCodecs(mkImage(4000, 3000));
    const r = await optimise('IMG_001.heic', header('heic'), c, { allowWebp: false });
    expect(r.resized).toBe(true);
    expect(r.newDims).toEqual([2000, 1500]);
    expect(r.converted).toBe(true);
    expect(r.outName).toBe('scaled_IMG_001.jpg');
    expect(r.outType).toBe('image/jpeg');
    expect(r.newBytes).toBeLessThanOrEqual(MB);
  });

  it('forced WebP: converts a JPEG to WebP even when it already fits', async () => {
    const c = new MockCodecs(mkImage(800, 600));
    const r = await optimise('photo.jpg', header('jpeg'), c, { outputFormat: 'webp' });
    expect(r.converted).toBe(true);
    expect(r.outName).toBe('scaled_photo.webp');
    expect(r.outType).toBe('image/webp');
  });

  it('forced JPEG: outputs JPEG from a PNG input', async () => {
    const c = new MockCodecs(mkImage(800, 600));
    const r = await optimise('logo.png', header('png'), c, { outputFormat: 'jpeg' });
    expect(r.converted).toBe(true);
    expect(r.outName).toBe('scaled_logo.jpg');
    expect(r.outType).toBe('image/jpeg');
  });

  it('forced PNG: stays PNG even over the cap (no WebP fallback)', async () => {
    const c = new MockCodecs(mkImage(2500, 2500, 200));
    const r = await optimise('photo.jpg', header('jpeg'), c, { outputFormat: 'png' });
    expect(r.converted).toBe(true);
    expect(r.outName).toBe('scaled_photo.png');
    expect(r.outType).toBe('image/png');
    expect(r.newBytes).toBeGreaterThan(MB);
    expect(r.message).toMatch(/over size limit/);
  });

  it('precise fit: picks the highest quality under the cap, not a coarse ladder step', async () => {
    // mock JPEG size = px * q * 0.005; px = 480000 → size = 2400*q.
    // Cap 199200 = 2400*83, so q83 fits exactly while q84 would not.
    const c = new MockCodecs(mkImage(800, 600));
    const r = await optimise('photo.jpg', header('jpeg'), c, {
      allowWebp: false, maxBytes: 199200,
    });
    expect(r.compressed).toBe(true);
    expect(r.newBytes).toBeLessThanOrEqual(199200);
    expect(r.newBytes).toBe(2400 * 83);           // landed on q83…
    expect(r.newBytes).toBeGreaterThan(2400 * 80); // …closer than the coarse q80 step
  });
});

describe('exif orientation', () => {
  function jpegWithOrientation(o: number): Uint8Array {
    // FFD8 FFE1 <len> "Exif\0\0" + little-endian TIFF, 1 IFD entry: orientation
    const tiff: number[] = [];
    tiff.push(0x49, 0x49, 0x2a, 0x00);          // "II", 42
    tiff.push(0x08, 0x00, 0x00, 0x00);          // IFD0 at offset 8
    tiff.push(0x01, 0x00);                      // 1 entry
    tiff.push(0x12, 0x01, 0x03, 0x00);          // tag 0x0112, type SHORT
    tiff.push(0x01, 0x00, 0x00, 0x00);          // count 1
    tiff.push(o & 0xff, 0x00, 0x00, 0x00);      // value
    tiff.push(0x00, 0x00, 0x00, 0x00);          // next IFD = 0
    const exif = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00, ...tiff]; // "Exif\0\0"+TIFF
    const len = exif.length + 2;
    return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, (len >> 8) & 0xff, len & 0xff, ...exif, 0xff, 0xda]);
  }

  it('reads orientation tag', () => {
    expect(readJpegOrientation(jpegWithOrientation(6))).toBe(6);
    expect(readJpegOrientation(new Uint8Array([0xff, 0xd8, 0xff, 0xda]))).toBe(1);
  });

  it('applyOrientation(6) swaps dimensions and remaps pixels', () => {
    // 2x1 image: pixel0 red-ish, pixel1 green-ish
    const data = new Uint8ClampedArray([10, 0, 0, 255, 20, 0, 0, 255]);
    const out = applyOrientation({ data, width: 2, height: 1 }, 6);
    expect([out.width, out.height]).toEqual([1, 2]);
    expect(out.data[0]).toBe(10); // out(0,0) <- src(0,0)
    expect(out.data[4]).toBe(20); // out(0,1) <- src(1,0)
  });

  it('hasAlpha detects transparency', () => {
    expect(hasAlpha(mkImage(4, 4, 200))).toBe(true);
    expect(hasAlpha(mkImage(4, 4, 255))).toBe(false);
  });
});
