// Client-side persistence for the tool's last-used settings and user-created presets.
// Everything lives in localStorage (available in both the web PWA and the Tauri WebView),
// and every access is guarded so private-mode / disabled / quota-exceeded storage degrades
// to a no-op rather than throwing. Loads merge over the caller's defaults and copy only
// known keys, so settings saved by an older build that lacks a newer field simply pick that
// field up from defaults — no migration step is ever needed as later releases grow `UiOpts`.
import type { OutputFormat } from '../core/types';
import type { Preset } from '../core/presets';

// The shape of the tool's live UI state. Mirrors the form controls in Tool.svelte and uses
// `maxMB` (not the core engine's `maxBytes`); the two are bridged at submit time.
export interface UiOpts {
  maxDim: number;
  maxMB: number;
  prefix: string;
  allowWebp: boolean;
  qualityFloor: number;
  outputFormat: OutputFormat;
}

export const DEFAULT_UI_OPTS: UiOpts = {
  maxDim: 2000, maxMB: 1, prefix: 'scaled_', allowWebp: true,
  qualityFloor: 60, outputFormat: 'auto',
};

const SETTINGS_KEY = 'scalir:settings:v1';
const PRESETS_KEY = 'scalir:presets:v1';

// A single guarded accessor keeps every call site free of try/catch. Returns null when
// storage is unavailable (test/SSR env, private mode, blocked cookies) — even *accessing*
// localStorage can throw when the browser blocks it, hence the try around the reference.
function store(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function read<T>(key: string): T | null {
  const s = store();
  if (!s) return null;
  try {
    const raw = s.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null; // malformed JSON or read error
  }
}

function write(key: string, value: unknown): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded or blocked — settings just won't persist this session */
  }
}

// Load saved settings merged over `defaults`. Only keys present in `defaults` are copied
// across, so a stale or hand-edited payload can neither inject unexpected fields nor drop
// newly-added ones (those fall back to their default).
export function loadSettings(defaults: UiOpts = DEFAULT_UI_OPTS): UiOpts {
  const saved = read<Partial<UiOpts>>(SETTINGS_KEY);
  const merged = { ...defaults };
  if (saved && typeof saved === 'object') {
    for (const k of Object.keys(defaults) as (keyof UiOpts)[]) {
      if (saved[k] !== undefined) merged[k] = saved[k] as never;
    }
  }
  return merged;
}

export function saveSettings(o: UiOpts): void {
  write(SETTINGS_KEY, o);
}

export function loadCustomPresets(): Preset[] {
  const saved = read<Preset[]>(PRESETS_KEY);
  return Array.isArray(saved) ? saved : [];
}

export function saveCustomPresets(presets: Preset[]): void {
  write(PRESETS_KEY, presets);
}
