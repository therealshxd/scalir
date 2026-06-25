import type { Codecs, Fmt, InputFmt, ImageDataLike, Options, OptimiseResult } from './types';
import { DEFAULT_OPTIONS } from './types';
import { detectFormat, resizeTarget, bestQualityUnder, mimeOf, extForFmt, QUALITY_LADDER } from './rules';
import { makeOutName } from './naming';
import { readJpegOrientation, applyOrientation } from './exif';

/**
 * Optimise a single image per the three rules:
 *  1. Resize so the longest side is <= maxDim (aspect kept, no crop).
 *  2. If still over maxBytes, re-encode at the best quality that fits,
 *     converting to WebP when that yields a meaningfully smaller file.
 *  3. Output name = prefix + original stem + ext (ext changes only on convert).
 */
export async function optimise(
  name: string,
  bytes: Uint8Array,
  codecs: Codecs,
  options: Partial<Options> = {},
): Promise<OptimiseResult> {
  const opts: Options = { ...DEFAULT_OPTIONS, ...options };
  const res: OptimiseResult = {
    name, outName: '', status: 'ok', action: '', resized: false, compressed: false,
    converted: false, origDims: [0, 0], newDims: [0, 0], origBytes: bytes.length,
    newBytes: 0, outType: '', message: '',
  };

  const inputFmt: InputFmt | null = detectFormat(name, bytes);
  if (!inputFmt) { res.status = 'skipped'; res.message = 'unsupported format'; return res; }

  let img: ImageDataLike;
  try {
    img = await codecs.decode(inputFmt, bytes);
  } catch (e: any) {
    res.status = 'error';
    res.message = 'decode failed: ' + (e?.message ?? String(e));
    return res;
  }

  // Rule 1a: honour EXIF orientation for JPEGs (codecs don't auto-rotate).
  if (inputFmt === 'jpeg') {
    const o = readJpegOrientation(bytes);
    if (o > 1) img = applyOrientation(img, o);
  }
  res.origDims = [img.width, img.height];

  // Rule 1b: resize if oversized.
  const target = resizeTarget(img.width, img.height, opts.maxDim);
  if (target) {
    img = await codecs.resize(img, target[0], target[1]);
    res.resized = true;
  }
  res.newDims = [img.width, img.height];

  // Choose the output format. 'auto' keeps the input format (HEIC has no encoder, so
  // it becomes JPEG); otherwise the user's forced choice wins. Mark converted whenever
  // the output format differs from the input so the extension is updated downstream.
  const forced = opts.outputFormat !== 'auto';
  const baseFmt: Fmt = opts.outputFormat !== 'auto'
    ? opts.outputFormat
    : (inputFmt === 'heic' ? 'jpeg' : inputFmt);
  const inputAsFmt: Fmt | null = inputFmt === 'heic' ? null : inputFmt;
  if (baseFmt !== inputAsFmt) res.converted = true;
  const ceil = QUALITY_LADDER[0];

  // Rule 2: encode at top quality, then shrink to fit if needed.
  let best = await codecs.encode(baseFmt, img, ceil);
  let bestFmt: Fmt = baseFmt;

  if (best.length > opts.maxBytes) {
    // Auto mode only: try WebP as an alternative when allowed (often much smaller).
    if (!forced && opts.allowWebp && baseFmt !== 'webp') {
      const webp = await codecs.encode('webp', img, ceil);
      if (webp.length < best.length * opts.webpAdvantage) {
        best = webp; bestFmt = 'webp'; res.converted = true;
      }
    }
    // Lossy format: find the highest quality that still fits (closest under the cap).
    if (best.length > opts.maxBytes && (bestFmt === 'jpeg' || bestFmt === 'webp')) {
      best = await bestQualityUnder(
        (q) => codecs.encode(bestFmt, img, q), opts.qualityFloor, ceil, opts.maxBytes,
      );
    }
    // PNG is lossless; in auto mode fall back to WebP if it helps (a forced PNG stays PNG).
    if (best.length > opts.maxBytes && bestFmt === 'png' && !forced && opts.allowWebp) {
      const webp = await bestQualityUnder(
        (q) => codecs.encode('webp', img, q), opts.qualityFloor, ceil, opts.maxBytes,
      );
      if (webp.length < best.length) { best = webp; bestFmt = 'webp'; res.converted = true; }
    }
    res.compressed = true;
  }

  res.outName = makeOutName(name, opts.prefix, res.converted ? extForFmt(bestFmt) : null);
  res.outBytes = best;
  res.newBytes = best.length;
  res.outType = mimeOf(bestFmt);

  const bits: string[] = [];
  if (res.resized) bits.push(`resized ${res.origDims[0]}×${res.origDims[1]}→${res.newDims[0]}×${res.newDims[1]}`);
  if (res.compressed) bits.push(`compressed ${Math.round(res.origBytes / 1024)}KB→${Math.round(res.newBytes / 1024)}KB`);
  if (res.converted) bits.push(`→ ${bestFmt.toUpperCase()}`);
  if (!bits.length) bits.push('already within limits');
  res.action = bits.join(', ');
  if (res.newBytes > opts.maxBytes) res.message = 'still over size limit at quality floor';
  return res;
}
