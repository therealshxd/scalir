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
