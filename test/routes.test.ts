// Integrity tests for the landing-site data: the shared route registry (routes.data.js) and the
// landing-page content (landing/content.ts). These encode the SEO invariants that used to be
// conventions — unique metadata within length caps, no thin pages, FAQ questions that never
// repeat site-wide (a FAQPage rich-results requirement), working cross-links, and tool presets
// that reference real settings. Adding a page that violates any of them fails CI.
import { describe, it, expect } from 'vitest';
import { ROUTE_LIST, byId, byPath } from '../src/lib/routes.data.js';
import { LANDING_CONTENT, type LandingSection } from '../src/lib/landing/content';
import { HOME_FAQ, FEATURES_FAQ, DOWNLOAD_FAQ, SELF_HOSTING_FAQ } from '../src/lib/seo';
import { DEFAULT_UI_OPTS } from '../src/lib/persist';

const landing = ROUTE_LIST.filter((r) => r.kind === 'landing');

function dupes(values: string[]): string[] {
  const seen = new Set<string>();
  const out = new Set<string>();
  for (const v of values) (seen.has(v) ? out : seen).add(v);
  return [...out];
}

describe('route registry', () => {
  it('has unique ids, paths, titles and descriptions', () => {
    expect(dupes(ROUTE_LIST.map((r) => r.id))).toEqual([]);
    expect(dupes(ROUTE_LIST.map((r) => r.path))).toEqual([]);
    expect(dupes(ROUTE_LIST.map((r) => r.title))).toEqual([]);
    expect(dupes(ROUTE_LIST.map((r) => r.description))).toEqual([]);
  });

  it('uses well-formed paths (leading slash, no trailing slash) with home first', () => {
    expect(ROUTE_LIST[0].id).toBe('home');
    for (const r of ROUTE_LIST) {
      expect(r.path, r.id).toMatch(/^\//);
      if (r.path !== '/') expect(r.path.endsWith('/'), `${r.id} has a trailing slash`).toBe(false);
    }
  });

  it('keeps titles and descriptions within SERP length caps', () => {
    for (const r of ROUTE_LIST) {
      expect(r.title.length, `${r.id} title too long`).toBeLessThanOrEqual(65);
      expect(r.description.length, `${r.id} description too short`).toBeGreaterThanOrEqual(70);
      // Landing pages are held to the strict snippet cap; the pre-existing bespoke pages are
      // grandfathered slightly above it.
      const cap = r.kind === 'landing' ? 160 : 220;
      expect(r.description.length, `${r.id} description too long`).toBeLessThanOrEqual(cap);
    }
  });

  it('gives every landing route a rollout tier', () => {
    for (const r of landing) expect([1, 2, 3], `${r.id} missing tier`).toContain(r.tier);
  });

  it('derives byId/byPath consistently', () => {
    expect(Object.keys(byId)).toHaveLength(ROUTE_LIST.length);
    for (const r of ROUTE_LIST) {
      expect(byId[r.id]).toBe(r);
      expect(byPath[r.path]).toBe(r.id);
    }
  });
});

describe('landing content', () => {
  it('is a bijection with the landing routes', () => {
    expect(Object.keys(LANDING_CONTENT).sort()).toEqual(landing.map((r) => r.id).sort());
  });

  it('has unique h1s and substantial, unique leads', () => {
    const entries = Object.entries(LANDING_CONTENT);
    expect(dupes(entries.map(([, c]) => c.h1))).toEqual([]);
    expect(dupes(entries.map(([, c]) => c.lead))).toEqual([]);
    for (const [id, c] of entries) {
      expect(c.lead.length, `${id} lead too thin`).toBeGreaterThanOrEqual(300);
      expect(c.sections.length, `${id} needs sections`).toBeGreaterThanOrEqual(3);
    }
  });

  it('has ≥3 FAQs per page with questions unique across the whole site', () => {
    const bespokeQs = [HOME_FAQ, FEATURES_FAQ, DOWNLOAD_FAQ, SELF_HOSTING_FAQ].flat().map((f) => f.q);
    const all = [...bespokeQs];
    for (const [id, c] of Object.entries(LANDING_CONTENT)) {
      expect(c.faq.length, `${id} needs ≥3 FAQs`).toBeGreaterThanOrEqual(3);
      all.push(...c.faq.map((f) => f.q));
    }
    expect(dupes(all)).toEqual([]);
  });

  it('only cross-links to routes that exist', () => {
    for (const [id, c] of Object.entries(LANDING_CONTENT)) {
      for (const s of c.sections) {
        if (s.type !== 'crossLinks') continue;
        for (const l of s.links) expect(byPath[l.path], `${id} links to unknown ${l.path}`).toBeTruthy();
      }
      for (const f of c.faq) {
        if (f.href) expect(byPath[f.href] ?? f.href.startsWith('http'), `${id} FAQ links to unknown ${f.href}`).toBeTruthy();
      }
    }
  });

  // Pages must rank for DIFFERENT keywords, not compete as near-duplicates of one template.
  // Measured as word-3-gram Jaccard similarity over each page's full visible text: every pair
  // of pages must be at least 60% unique (similarity < 40%). The live corpus sits around 4%.
  it('keeps every pair of landing pages at least 60% unique', () => {
    const text = (id: string): string => {
      const c = LANDING_CONTENT[id];
      const parts: string[] = [c.h1, c.lead, byId[id].title, byId[id].description];
      for (const s of c.sections as LandingSection[]) {
        if (s.type === 'prose') parts.push(s.h2, s.sub ?? '', ...s.paragraphs, ...(s.bullets ?? []));
        else if (s.type === 'steps') parts.push(s.h2, ...s.steps.flatMap((x) => [x.title, x.body]));
        else if (s.type === 'factTable') parts.push(s.h2, s.sub ?? '', ...s.columns, ...s.rows.flat());
        else if (s.type === 'comparison') parts.push(s.h2, s.verdict, ...s.rows.flatMap((r) => [r.feature, r.scalir, r.other]));
        else if (s.type === 'crossLinks') parts.push(s.h2, ...s.links.flatMap((l) => [l.label, l.blurb ?? '']));
      }
      parts.push(...c.faq.flatMap((f) => [f.q, f.a]));
      return parts.join(' ').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    };
    const shingles = (t: string): Set<string> => {
      const w = t.split(/\s+/).filter(Boolean);
      const out = new Set<string>();
      for (let i = 0; i <= w.length - 3; i++) out.add(w.slice(i, i + 3).join(' '));
      return out;
    };
    const ids = Object.keys(LANDING_CONTENT);
    const sets = new Map(ids.map((id) => [id, shingles(text(id))]));
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = sets.get(ids[i])!;
        const b = sets.get(ids[j])!;
        let inter = 0;
        for (const s of a) if (b.has(s)) inter++;
        const sim = inter / (a.size + b.size - inter);
        expect(sim, `${ids[i]} ↔ ${ids[j]} are ${(sim * 100).toFixed(1)}% similar (must be <40%)`).toBeLessThan(0.4);
      }
    }
  });

  it('uses only real UiOpts keys (with matching types) in tool presets', () => {
    for (const [id, c] of Object.entries(LANDING_CONTENT)) {
      if (!c.toolPreset) continue;
      for (const [k, v] of Object.entries(c.toolPreset)) {
        const def = (DEFAULT_UI_OPTS as unknown as Record<string, unknown>)[k];
        expect(def, `${id} preset key "${k}" is not a UiOpts field`).toBeDefined();
        expect(typeof v, `${id} preset key "${k}" has wrong type`).toBe(typeof def);
      }
    }
  });
});
