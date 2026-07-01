// One-click presets for the common image-optimisation goals. Each preset fills the
// custom controls; users can still fine-tune afterwards. `savings` is a typical
// estimate for indication only — actual savings depend on the source image.
import type { Options } from './types';

const MB = 1024 * 1024;
// A cap large enough that resizeTarget() never triggers, i.e. "don't resize".
export const NO_RESIZE = 100_000;

export interface Preset {
  id: string;
  name: string;
  blurb: string;   // what it's for
  savings: string; // typical estimate, e.g. "~85% smaller"
  origin?: 'builtin' | 'custom'; // custom presets are user-saved + deletable (undefined ⇒ builtin)
  opts: Pick<Options, 'maxDim' | 'maxBytes' | 'outputFormat' | 'qualityFloor' | 'allowWebp'>;
}

export const PRESETS: Preset[] = [
  {
    id: 'tiny',
    name: 'Tiny (WebP)',
    blurb: 'Smallest possible — thumbnails, avatars, fast-loading galleries.',
    savings: '~85% smaller',
    opts: { maxDim: 1000, maxBytes: Math.round(0.5 * MB), outputFormat: 'webp', qualityFloor: 55, allowWebp: true },
  },
  {
    id: 'web',
    name: 'Web optimized',
    blurb: 'Crisp, lightweight images for websites and blogs.',
    savings: '~70% smaller',
    opts: { maxDim: 1920, maxBytes: 1 * MB, outputFormat: 'webp', qualityFloor: 60, allowWebp: true },
  },
  {
    id: 'email',
    name: 'Email & sharing (JPEG)',
    blurb: 'Universally compatible JPEGs that fit attachment limits.',
    savings: '~65% smaller',
    opts: { maxDim: 1600, maxBytes: 1 * MB, outputFormat: 'jpeg', qualityFloor: 60, allowWebp: false },
  },
  {
    id: 'high',
    name: 'High quality',
    blurb: 'Large dimensions, minimal loss — printing or archiving.',
    savings: '~40% smaller',
    opts: { maxDim: 3000, maxBytes: 3 * MB, outputFormat: 'auto', qualityFloor: 75, allowWebp: true },
  },
  {
    id: 'shrink',
    name: 'Smaller file (keep size)',
    blurb: 'Keep full resolution, just trim the file size.',
    savings: '~50% smaller',
    opts: { maxDim: NO_RESIZE, maxBytes: 2 * MB, outputFormat: 'auto', qualityFloor: 60, allowWebp: true },
  },
];

// Human-readable size in MB with trailing zeros trimmed (0.5 MB, 1 MB, 2 MB…).
function mb(bytes: number): string {
  return `${Number((bytes / MB).toFixed(2))} MB`;
}

// Friendly format labels matching the UI's own capitalisation (WebP, not WEBP).
const FORMAT_LABEL: Record<Preset['opts']['outputFormat'], string> = {
  auto: 'Auto', jpeg: 'JPEG', png: 'PNG', webp: 'WebP', avif: 'AVIF',
};

// A structured, label/value breakdown of what a preset actually does — rendered in the
// preset tooltip so users can see each preset's settings at a glance before applying it.
export function presetSummary(
  opts: Preset['opts'],
): { label: string; value: string }[] {
  return [
    { label: 'Max dimension', value: opts.maxDim >= NO_RESIZE ? 'Full size' : `${opts.maxDim} px` },
    { label: 'Max size', value: `≤ ${mb(opts.maxBytes)}` },
    { label: 'Format', value: FORMAT_LABEL[opts.outputFormat] },
    { label: 'Quality floor', value: String(opts.qualityFloor) },
  ];
}
