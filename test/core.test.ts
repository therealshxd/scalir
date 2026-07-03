import { describe, it, expect } from 'vitest';
import type { Codecs, Fmt, InputFmt, ImageDataLike } from '../src/core/types';
import { optimise } from '../src/core/optimise';
import { detectFormat, resizeTarget, computeResize, hasAlpha } from '../src/core/rules';
import { makeOutName, withSequenceNumber, type NameOptions } from '../src/core/naming';
import { presetSummary, NO_RESIZE } from '../src/core/presets';
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

// ISO-BMFF header with an arbitrary major brand (AVIF and HEIC share the container).
function ftypHeader(brand: string): Uint8Array {
  const b = new Uint8Array(32);
  b[4] = 0x66; b[5] = 0x74; b[6] = 0x79; b[7] = 0x70; // 'ftyp'
  for (let i = 0; i < 4; i++) b[8 + i] = brand.charCodeAt(i);
  return b;
}

// First N bytes set, rest zero — for simple magic-byte signatures.
function bytesOf(...vals: number[]): Uint8Array {
  const b = new Uint8Array(32);
  vals.forEach((v, i) => { b[i] = v; });
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
  it('detects gif/bmp/tiff from magic bytes', () => {
    expect(detectFormat('x', bytesOf(0x47, 0x49, 0x46))).toBe('gif');         // "GIF"
    expect(detectFormat('x', bytesOf(0x42, 0x4d))).toBe('bmp');               // "BM"
    expect(detectFormat('x', bytesOf(0x49, 0x49, 0x2a, 0x00))).toBe('tiff');  // little-endian
    expect(detectFormat('x', bytesOf(0x4d, 0x4d, 0x00, 0x2a))).toBe('tiff');  // big-endian
  });
  it('distinguishes AVIF from HEIC by ftyp brand', () => {
    expect(detectFormat('x', ftypHeader('avif'))).toBe('avif');
    expect(detectFormat('x', ftypHeader('avis'))).toBe('avif');
    expect(detectFormat('x', ftypHeader('heic'))).toBe('heic');
    expect(detectFormat('x', ftypHeader('mif1'))).toBe('heic');
  });
  it('detects heic/heif from extension when magic bytes absent', () => {
    const plain = new Uint8Array(32); // no magic bytes
    expect(detectFormat('photo.heic', plain)).toBe('heic');
    expect(detectFormat('photo.heif', plain)).toBe('heic');
  });
  it('detects new formats from extension when magic bytes absent', () => {
    const plain = new Uint8Array(32);
    expect(detectFormat('a.avif', plain)).toBe('avif');
    expect(detectFormat('a.gif', plain)).toBe('gif');
    expect(detectFormat('a.tif', plain)).toBe('tiff');
    expect(detectFormat('a.tiff', plain)).toBe('tiff');
    expect(detectFormat('a.bmp', plain)).toBe('bmp');
  });
  it('resizeTarget keeps aspect, only shrinks', () => {
    expect(resizeTarget(4000, 3000, 2000)).toEqual([2000, 1500]);
    expect(resizeTarget(5000, 1000, 2000)).toEqual([2000, 400]);
    expect(resizeTarget(1500, 1000, 2000)).toBe(null);
  });
});

describe('computeResize', () => {
  const O = (o: Partial<Parameters<typeof computeResize>[2]> = {}): Parameters<typeof computeResize>[2] =>
    ({ resizeMode: 'longest', maxDim: 2000, targetW: 1920, targetH: 1080, percent: 50, ...o });

  it('longest delegates to resizeTarget', () => {
    expect(computeResize(4000, 3000, O({ maxDim: 2000 }))).toEqual([2000, 1500]);
    expect(computeResize(1500, 1000, O({ maxDim: 2000 }))).toBe(null);
  });
  it('exact width scales keeping aspect, never upscales', () => {
    expect(computeResize(4000, 3000, O({ resizeMode: 'width', targetW: 1200 }))).toEqual([1200, 900]);
    expect(computeResize(800, 600, O({ resizeMode: 'width', targetW: 1200 }))).toBe(null);   // smaller → as-is
    expect(computeResize(1200, 900, O({ resizeMode: 'width', targetW: 1200 }))).toBe(null);  // equal → as-is
  });
  it('exact height scales keeping aspect, never upscales', () => {
    expect(computeResize(4000, 3000, O({ resizeMode: 'height', targetH: 600 }))).toEqual([800, 600]);
    expect(computeResize(800, 600, O({ resizeMode: 'height', targetH: 900 }))).toBe(null);
  });
  it('percent scales both sides; >= 100 leaves as-is', () => {
    expect(computeResize(4000, 3000, O({ resizeMode: 'percent', percent: 50 }))).toEqual([2000, 1500]);
    expect(computeResize(1000, 500, O({ resizeMode: 'percent', percent: 25 }))).toEqual([250, 125]);
    expect(computeResize(4000, 3000, O({ resizeMode: 'percent', percent: 100 }))).toBe(null);
  });
});

describe('naming', () => {
  const N = (o: Partial<NameOptions> = {}): NameOptions =>
    ({ prefix: 'scaled_', rename: '', suffix: '', lowercase: false, slugify: false, ...o });

  it('keeps extension by default, swaps on convert', () => {
    expect(makeOutName('beach.jpg', N(), null)).toBe('scaled_beach.jpg');
    expect(makeOutName('beach.jpeg', N(), null)).toBe('scaled_beach.jpeg');
    expect(makeOutName('logo.png', N(), '.webp')).toBe('scaled_logo.webp');
  });

  it('rename replaces the original base name, keeping prefix/suffix/extension', () => {
    expect(makeOutName('DSC_0001.jpg', N({ rename: 'gallery' }), null)).toBe('scaled_gallery.jpg');
    expect(makeOutName('DSC_0001.jpg', N({ prefix: '', rename: 'hero', suffix: '-lg' }), '.webp'))
      .toBe('hero-lg.webp');
    // empty/whitespace rename → original stem
    expect(makeOutName('beach.jpg', N({ rename: '   ' }), null)).toBe('scaled_beach.jpg');
    // rename runs through lowercase + slugify like any other name
    expect(makeOutName('x.JPG', N({ prefix: '', rename: 'My Gallery', lowercase: true, slugify: true }), null))
      .toBe('my-gallery.jpg');
  });

  it('applies suffix before the extension', () => {
    expect(makeOutName('beach.jpg', N({ suffix: '_web' }), null)).toBe('scaled_beach_web.jpg');
    expect(makeOutName('logo.png', N({ prefix: '', suffix: '-v2' }), '.webp')).toBe('logo-v2.webp');
  });

  it('lowercases the whole name including the extension', () => {
    expect(makeOutName('Beach.JPG', N({ prefix: 'IMG_', lowercase: true }), null)).toBe('img_beach.jpg');
  });

  it('slugifies spaces and strips unsafe characters, collapsing dashes', () => {
    expect(makeOutName('My  Photo (final).jpg', N({ prefix: '', slugify: true }), null))
      .toBe('My-Photo-final.jpg');
    // combined lowercase + slugify
    expect(makeOutName('Café Sunset.JPG', N({ prefix: 'web_', lowercase: true, slugify: true }), null))
      .toBe('web_caf-sunset.jpg');
  });
});

describe('withSequenceNumber', () => {
  it('appends a dash + number padded to the batch width, before the extension', () => {
    expect(withSequenceNumber('scaled_photo.jpg', 1, 5)).toBe('scaled_photo-01.jpg');
    expect(withSequenceNumber('scaled_photo.jpg', 12, 5)).toBe('scaled_photo-12.jpg');
    expect(withSequenceNumber('a.webp', 7, 1000)).toBe('a-0007.webp');
  });
  it('pads to a minimum of two digits even for tiny batches', () => {
    expect(withSequenceNumber('x.png', 3, 1)).toBe('x-03.png');
  });
  it('handles names without an extension', () => {
    expect(withSequenceNumber('noext', 2, 10)).toBe('noext-02');
  });
});

describe('presetSummary', () => {
  const MB = 1024 * 1024;
  const rows = (o: Parameters<typeof presetSummary>[0]) =>
    Object.fromEntries(presetSummary(o).map((r) => [r.label, r.value]));

  it('summarises a forced-format preset', () => {
    const s = rows({ maxDim: 1920, maxBytes: 1 * MB, outputFormat: 'webp', qualityFloor: 60, allowWebp: true });
    expect(s['Max dimension']).toBe('1920 px');
    expect(s['Max size']).toBe('≤ 1 MB');
    expect(s['Format']).toBe('WebP');
    expect(s['Quality floor']).toBe('60');
  });

  it('shows "Auto" for auto format and "Full size" for no-resize', () => {
    const s = rows({ maxDim: NO_RESIZE, maxBytes: 2 * MB, outputFormat: 'auto', qualityFloor: 75, allowWebp: true });
    expect(s['Max dimension']).toBe('Full size');
    expect(s['Format']).toBe('Auto');
    expect(s['Max size']).toBe('≤ 2 MB');
  });

  it('trims trailing zeros in the size (0.5 MB)', () => {
    const s = rows({ maxDim: 1000, maxBytes: Math.round(0.5 * MB), outputFormat: 'jpeg', qualityFloor: 55, allowWebp: false });
    expect(s['Max size']).toBe('≤ 0.5 MB');
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

  it('small image already within limits: copied through unchanged, not re-encoded', async () => {
    const bytes = header('jpeg');
    const c = new MockCodecs(mkImage(800, 600));
    const r = await optimise('ok.jpg', bytes, c, {});
    expect(r.resized).toBe(false);
    expect(r.compressed).toBe(false);
    expect(r.converted).toBe(false);
    expect(r.copied).toBe(true);
    expect(r.outBytes).toBe(bytes);              // original bytes, not a re-encode
    expect(r.newBytes).toBe(r.origBytes);
    expect(r.outName).toBe('scaled_ok.jpg');
    expect(r.action).toMatch(/copied/);
  });

  it('copies an already-compliant PNG unchanged (no re-encode across formats)', async () => {
    const bytes = header('png');
    const c = new MockCodecs(mkImage(500, 400, 200)); // small, with alpha
    const r = await optimise('icon.png', bytes, c, {});
    expect(r.copied).toBe(true);
    expect(r.outBytes).toBe(bytes);
    expect(r.converted).toBe(false);
    expect(r.outName).toBe('scaled_icon.png');
    expect(r.outType).toBe('image/png');
  });

  it('still resizes an under-cap file that exceeds max dimension (dimension cap wins)', async () => {
    const c = new MockCodecs(mkImage(4000, 3000));
    const r = await optimise('huge.jpg', header('jpeg'), c, { allowWebp: false });
    expect(r.resized).toBe(true);
    expect(r.newDims).toEqual([2000, 1500]);
    expect(r.copied).toBeFalsy();
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

  it('forced AVIF: converts a JPEG and quality-searches under the cap', async () => {
    // Same size model as the precise-fit test: avif size = 2400*q; cap = 2400*83.
    const big = new Uint8Array(250_000);
    big[0] = 0xff; big[1] = 0xd8; big[2] = 0xff; // JPEG magic, larger than the cap
    const c = new MockCodecs(mkImage(800, 600));
    const r = await optimise('photo.jpg', big, c, {
      allowWebp: false, maxBytes: 199200, outputFormat: 'avif',
    });
    expect(r.converted).toBe(true);
    expect(r.outName).toBe('scaled_photo.avif');
    expect(r.outType).toBe('image/avif');
    expect(r.compressed).toBe(true);
    expect(r.newBytes).toBeLessThanOrEqual(199200);
    expect(r.newBytes).toBe(2400 * 83);
  });

  it('GIF input in auto: outputs WebP with a changed extension', async () => {
    const c = new MockCodecs(mkImage(800, 600));
    const r = await optimise('anim.gif', bytesOf(0x47, 0x49, 0x46), c, {});
    expect(r.status).toBe('ok');
    expect(r.converted).toBe(true);
    expect(r.outName).toBe('scaled_anim.webp');
    expect(r.outType).toBe('image/webp');
  });

  it('AVIF input in auto: preserved as AVIF, copied through when already compliant', async () => {
    const bytes = ftypHeader('avif');
    const c = new MockCodecs(mkImage(800, 600));
    const r = await optimise('photo.avif', bytes, c, {});
    expect(r.copied).toBe(true);
    expect(r.converted).toBe(false);
    expect(r.outBytes).toBe(bytes);
    expect(r.outName).toBe('scaled_photo.avif');
    expect(r.outType).toBe('image/avif');
  });

  it('precise fit: picks the highest quality under the cap, not a coarse ladder step', async () => {
    // mock JPEG size = px * q * 0.005; px = 480000 → size = 2400*q.
    // Cap 199200 = 2400*83, so q83 fits exactly while q84 would not.
    // Input must be larger than the cap, else copy-through short-circuits before encoding.
    const big = new Uint8Array(250_000);
    big[0] = 0xff; big[1] = 0xd8; big[2] = 0xff; // JPEG magic
    const c = new MockCodecs(mkImage(800, 600));
    const r = await optimise('photo.jpg', big, c, {
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
