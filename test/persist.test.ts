import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSettings, saveSettings, loadCustomPresets, saveCustomPresets,
  DEFAULT_UI_OPTS, type UiOpts,
} from '../src/lib/persist';
import type { Preset } from '../src/core/presets';

// Minimal in-memory localStorage so the guarded accessors in persist.ts see real storage
// under the node test env (which has none by default). persist.ts reads `localStorage`
// lazily, so assigning it per-test is enough.
class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  get length() { return this.m.size; }
}

beforeEach(() => {
  (globalThis as any).localStorage = new MemStorage();
});

describe('persist: settings', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_UI_OPTS);
  });

  it('round-trips saved settings', () => {
    const o: UiOpts = { ...DEFAULT_UI_OPTS, maxDim: 1234, maxMB: 2.5, prefix: 'web_', outputFormat: 'webp' };
    saveSettings(o);
    expect(loadSettings()).toEqual(o);
  });

  it('merges over defaults: missing keys fall back, unknown keys are dropped', () => {
    // A payload from an older build (missing `qualityFloor`) with a stray key not in UiOpts.
    localStorage.setItem('scalir:settings:v1', JSON.stringify({ maxDim: 800, phantom: 42 }));
    const loaded = loadSettings();
    expect(loaded.maxDim).toBe(800);                                // saved value applied
    expect(loaded.qualityFloor).toBe(DEFAULT_UI_OPTS.qualityFloor); // missing → default
    expect('phantom' in loaded).toBe(false);                        // unknown key not carried
  });

  it('tolerates malformed JSON by returning defaults', () => {
    localStorage.setItem('scalir:settings:v1', '{not json');
    expect(loadSettings()).toEqual(DEFAULT_UI_OPTS);
  });

  it('no-ops safely when storage is unavailable', () => {
    delete (globalThis as any).localStorage;
    expect(() => saveSettings(DEFAULT_UI_OPTS)).not.toThrow();
    expect(loadSettings()).toEqual(DEFAULT_UI_OPTS);
  });
});

describe('persist: custom presets', () => {
  const preset: Preset = {
    id: 'custom-1', name: 'Mine', blurb: '', savings: 'custom', origin: 'custom',
    opts: { maxDim: 1000, maxBytes: 500000, outputFormat: 'webp', qualityFloor: 60, allowWebp: true },
  };

  it('returns [] when nothing is stored', () => {
    expect(loadCustomPresets()).toEqual([]);
  });

  it('round-trips custom presets', () => {
    saveCustomPresets([preset]);
    expect(loadCustomPresets()).toEqual([preset]);
  });

  it('returns [] for a non-array payload', () => {
    localStorage.setItem('scalir:presets:v1', JSON.stringify({ nope: true }));
    expect(loadCustomPresets()).toEqual([]);
  });
});
