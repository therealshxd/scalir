# Scalir — Claude Code Handoff

Context + tasks for continuing this project in Claude Code. The app works and the build is green, but there's a UX bug to fix (progress/freezing) and a set of pre-go-live checks. Read top to bottom.

---

## 1. What this project is

**Scalir** — a free, private, **in-browser** bulk image optimiser. No backend, no uploads; all processing runs on the user's device via WebAssembly. It also presents as a one-page marketing site with two (placeholder) docs pages.

The three optimisation rules:
1. Resize so the longest side ≤ 2000px (aspect kept, never cropped).
2. If still > 1 MB, re-encode at the best quality that fits, converting to WebP when smaller.
3. Output named `scaled_<original>` (extension changes only on conversion).

**Stack:** Svelte 5 + Vite 8 + TypeScript, jSquash WASM codecs (MozJPEG / libwebp / libpng) + `@jsquash/resize`, JSZip, vite-plugin-pwa.

---

## 2. Project structure

```
src/
  core/                framework-free engine (unit-tested, no DOM)
    optimise.ts          orchestrates the 3 rules
    rules.ts             format detect, resize math, quality ladder, hasAlpha
    exif.ts              JPEG orientation read + apply
    naming.ts            scaled_ prefix
    codecs.ts            jSquash (WASM) implementation of the Codecs interface  <-- runs on main thread today
    types.ts             Codecs interface, Options, OptimiseResult
    index.ts
  lib/
    Tool.svelte          the optimiser UI + the processing loop  <-- BUG IS HERE
    Home.svelte          hero + 8 sections, embeds <Tool/>
    SelfHosting.svelte   docs placeholder
    Download.svelte      installers placeholder
  App.svelte             nav + hash router + footer
  main.ts, app.css
test/core.test.ts        vitest, mock codecs (12 tests, all passing)
```

Commands: `npm run dev`, `npm run build`, `npm run preview`, `npm test`, `npm run check` (svelte-check).

---

## 3. Status

**Done & verified**
- Engine logic — 12 vitest cases pass (resize math, quality step-down, WebP conversion, alpha-safe PNG, over-limit flag, naming, EXIF orientation).
- `svelte-check` clean, `vite build` succeeds, PWA + WASM codecs bundle correctly.

**Done but NOT verified in a real browser**
- The live decode → resize → encode path (jSquash can't run under Node, so it was never exercised end-to-end — only the logic via mock codecs).
- Folder pickers / ZIP / save-to-folder, cross-browser behaviour, mobile.

**Known bug** — see §4.

---

## 4. THE BUG TO FIX (priority 1): UI freezes, then dumps all results at once

**Symptom (reported):** while optimising, the tool freezes; then every result appears at once instead of one-by-one.

**Root cause:** in `src/lib/Tool.svelte`, `run()` processes images in a `for` loop on the **main thread** and yields with `await Promise.resolve()`. That's a *microtask* — the browser drains microtasks **before** it paints, so Svelte's per-iteration `rows = [...rows, r]` updates never render until the whole loop finishes. On top of that, jSquash's WASM encode/decode is CPU-heavy and runs on the main thread, so the tab genuinely blocks (can't scroll/paint) during processing.

**Fix — do both tiers:**

### 4a. Quick interim fix (makes progress visible)
Replace the microtask yield with a real macrotask + a Svelte DOM flush so each row paints before the next image starts:

```ts
import { tick } from 'svelte';
// inside the loop, after appending a row:
await tick();
await new Promise((r) => setTimeout(r, 0)); // macrotask: lets the browser paint
```

This shows images one-by-one, but the tab will still jank during each encode (heavy work is still on the main thread). Acceptable stopgap; not the real fix.

### 4b. Proper fix (do this): move processing into a Web Worker
Offload the engine so the main thread stays responsive and progress is smooth.

- Create `src/lib/optimise.worker.ts`:
  ```ts
  import { optimise } from '../core/optimise';
  import { jsquashCodecs } from '../core/codecs';
  self.onmessage = async (e) => {
    const { id, name, bytes, opts } = e.data;
    const r = await optimise(name, bytes, jsquashCodecs, opts);
    // transfer the output buffer back to avoid a copy
    const transfer = r.outBytes ? [r.outBytes.buffer] : [];
    (self as any).postMessage({ id, result: r }, transfer);
  };
  ```
- In `Tool.svelte`, create the worker with Vite's worker URL form:
  ```ts
  const worker = new Worker(new URL('./optimise.worker.ts', import.meta.url), { type: 'module' });
  ```
- Process **one image at a time** (the user explicitly wants sequential, per-image display): send a file, await its result message, append the row, update the progress bar, then send the next. This keeps the engine reusable and the UI updating per image.
- Transfer the input `ArrayBuffer` into the worker (transferable) to avoid copying large files.
- Remove the `await Promise.resolve()` hack once the worker is in.

**Things for Claude Code to verify with the worker:**
- [ ] Vite bundles the worker **and its WASM** correctly in `npm run build` (jSquash imports inside a module worker). Check the `dist/` output and that no codec 404s at runtime.
- [ ] The PWA service worker (vite-plugin-pwa) still precaches/serves the worker + WASM offline.
- [ ] `OffscreenCanvas` is NOT required — jSquash operates on raw `ImageData`/buffers, so the worker needs no DOM. Confirm nothing in the engine touches `window`/`document` (it shouldn't).
- [ ] Consider a small concurrency option later (pool of N workers) but keep the default sequential per the requested UX.

**Acceptance criteria for the fix:**
- [ ] Rows appear incrementally, one per image, as each finishes.
- [ ] The progress bar advances smoothly and the page stays scrollable during a 20+ image batch.
- [ ] No regression in outputs (still ≤2000px / ≤1 MB / correct names / alpha preserved).

---

## 5. Other things for Claude Code to check & fix before go-live

**Correctness / robustness**
- [ ] Run the §1-style browser smoke test (real JPEG/PNG-with-alpha/WebP/already-small/rotated-EXIF). Confirm parity with the rules.
- [ ] Large single images (e.g. 8000×6000) and large batches (50+): watch memory; consider freeing buffers after each image and revoking object URLs (already revoked after 8s — confirm).
- [ ] Cross-browser: Chrome/Edge (folder pickers), Firefox + Safari (ZIP fallback only). Confirm graceful capability detection.
- [ ] Mobile Safari/Chrome: layout + memory on big images.
- [ ] Error paths: corrupt/unsupported files should show `skipped`/`error` rows, not crash the batch.

**Build / hosting**
- [ ] Host must serve `.wasm` as `application/wasm` — verify on the chosen host (jSquash depends on it).
- [ ] Confirm `base: './'` works on the target domain/subpath.
- [ ] Re-test the PWA on the deployed URL: installable, offline after first load, no stale-cache after an update (SW is `autoUpdate`).
- [ ] Lighthouse pass (perf / PWA / a11y / best practices).

**Accessibility**
- [ ] The drop zone is `role="button"` with `tabindex` — add keyboard activation (Enter/Space) and a visible focus state.
- [ ] Check colour contrast of muted text on the dark theme.

**Placeholders to replace (also in `../finalise-project.md`)**
- [ ] Real GitHub repo URL — currently `https://github.com/shaddigital/scalir` in `Home.svelte` and `SelfHosting.svelte`.
- [ ] Donation link when ready (button is disabled "Coming Soon").
- [ ] Confirm `VITE_FREE_LIMIT` for the hosted build matches the "10 image limit" copy.

**Nice-to-have (post-fix)**
- [ ] AVIF output via `@jsquash/avif`.
- [ ] Open Graph / Twitter meta tags + social preview image in `index.html`.
- [ ] `Dockerfile` + `docker-compose.yml` for the self-hosting docs, then activate the "Deploy with Docker" button.

---

## 6. Suggested order of work for Claude Code

1. Reproduce the freeze in `npm run dev`, then implement the **Web Worker** fix (§4b) — this is the headline issue.
2. Run the browser smoke test (§5) and fix anything that surfaces.
3. Accessibility + error-path hardening.
4. Replace placeholders, then hand back for deploy.

The broader launch checklist (repo setup, CI, hosting, domain, docs, installers) lives in `../finalise-project.md` in the parent folder — this handoff covers the code-level work; that file covers the launch logistics.

---

## 7. Guardrails

- Keep the engine (`src/core/`) **DOM-free and framework-free** so it stays unit-testable and worker-safe. UI concerns belong in `src/lib/`.
- Don't break the `Codecs` interface — tests inject mock codecs through it.
- Keep everything **client-side** — no backend, no uploads (it's the core privacy promise).
- Run `npm test` and `npm run check` before considering any change done.
