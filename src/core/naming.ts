import type { Options } from './types';

/** The naming-related settings makeOutName needs (a subset of Options). */
export type NameOptions = Pick<Options, 'prefix' | 'rename' | 'suffix' | 'lowercase' | 'slugify'>;

/** Split a filename into its stem and extension (ext includes the leading dot, or ''). */
function splitExt(name: string): [stem: string, ext: string] {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ''];
}

/** Lowercase + collapse whitespace to '-', strip anything outside [a-z0-9._-], tidy dashes. */
function slugify(s: string): string {
  return s
    .replace(/\s+/g, '-')          // whitespace runs → single dash
    .replace(/[^a-zA-Z0-9._-]/g, '') // drop anything not filename-safe
    .replace(/-{2,}/g, '-')        // collapse repeated dashes
    .replace(/^-+|-+$/g, '');      // trim leading/trailing dashes
}

/**
 * Build the output filename: `prefix + stem + suffix` (+ optional lowercase/slugify) + ext.
 * If newExt is null the original extension is preserved (its case follows `lowercase`).
 * Sequential numbering is applied separately, on the main thread — see withSequenceNumber.
 */
export function makeOutName(name: string, opts: NameOptions, newExt: string | null): string {
  const [origStem, origExt] = splitExt(name);
  const stem = opts.rename.trim() || origStem; // a set rename replaces the original name
  let core = `${opts.prefix}${stem}${opts.suffix}`;
  let ext = newExt != null ? newExt : origExt;
  if (opts.lowercase) { core = core.toLowerCase(); ext = ext.toLowerCase(); }
  if (opts.slugify) core = slugify(core);
  return `${core}${ext}`;
}

/**
 * Append a batch sequence number before the extension, e.g. "scaled_photo-01.jpg".
 * Zero-padded to the width of the batch size so names sort correctly (min 2 digits).
 */
export function withSequenceNumber(name: string, n: number, total: number): string {
  const [stem, ext] = splitExt(name);
  const width = Math.max(2, String(total).length);
  return `${stem}-${String(n).padStart(width, '0')}${ext}`;
}
