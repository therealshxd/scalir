# Scalir — Bulk Image Optimiser

Scalir is a free, private, **in-browser** bulk image optimiser. Point it at images and it will:

- **Resize** anything larger than 2000px on its longest side down to fit a 2000×2000 box (aspect ratio kept, never cropped).
- **Compress** anything still over 1 MB to the highest quality that fits, converting to **WebP** when that yields a meaningfully smaller file.
- **Save** every result with a `scaled_` prefix.

Everything runs **on your device** — no uploads, no server, no AI, no tracking. Built with Svelte + Vite and the [jSquash](https://github.com/jamsinclair/jSquash) WebAssembly codecs (MozJPEG, libwebp, libpng) derived from Google's Squoosh.

## Live previews

Both long-lived branches have a live deployment:

| Branch | Environment | URL |
|---|---|---|
| `main` | **Production** (stable release) | https://scalir.org |
| `dev` | **Preview / WIP** (latest work in progress, may be unstable) | https://scalir.shad.digital |

Use the preview to try features before they ship in a release.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

Build the static site (deployable to any static host):

```bash
npm run build      # full landing site → dist/
npm run build:app  # tool only (no marketing pages) → dist-app/
npm run preview    # preview the production build
```

Run the engine tests:

```bash
npm test
```

## Using it

1. Drag images in, **Choose files**, or (on Chromium browsers) **Choose folder…**.
2. Adjust options if you like — max dimension, max size, prefix, WebP on/off, quality floor.
3. Click **Optimise**, then **Download all (ZIP)**, download individual files, or (Chromium) **Save all to folder…**.

## Browser support

| Capability | Chrome / Edge / Opera | Firefox | Safari |
|---|---|---|---|
| Drag-drop / choose files | ✅ | ✅ | ✅ |
| Download results (ZIP / individual) | ✅ | ✅ | ✅ |
| Pick a folder / save straight to a folder | ✅ | — | — |

Where the File System Access API isn't available (Firefox/Safari), the app falls back to a ZIP download — no features are lost, just the direct-to-folder convenience.

## Docker

Two Dockerfiles are provided — pick the one matching what you want to serve:

| File | Builds | Serves | Compose service |
|---|---|---|---|
| `Dockerfile` | `npm run build:app` → `dist-app/` | **tool only** | `scalir` (:8080) |
| `Dockerfile.landing` | `npm run build` → `dist/` | full landing site + tool | `scalir-landing` (:8081) |

```bash
# Tool only (most self-hosters):
docker compose up -d scalir          # → http://localhost:8080

# Full landing site:
docker compose up -d scalir-landing  # → http://localhost:8081
```

**Deployment panels (Dokploy / Coolify / CapRover):** create an **Application** (not a Compose
service), connect the repo, then set **Build Type → Dockerfile** — this is a *separate card below the
Git source section*, not inside the GitHub tab. Enter the **Docker File** path (`Dockerfile` for the
tool, `Dockerfile.landing` for the full site) and set the container port to `80`.

## Self-host vs hosted

This repo is the **unlimited self-host build**. The hosted demo applies a soft per-session image cap via an environment variable:

```bash
# .env  (hosted build only)
VITE_FREE_LIMIT=25
```

Leave it unset for unlimited. Because all processing is client-side, the cap is purely a UX choice — it has no effect on hosting cost, and the self-host build removes it.

## Project layout

```
src/core/        framework-free image engine (resize · compress · naming · EXIF)
  ├─ optimise.ts   the 3 rules, orchestrated
  ├─ rules.ts      format detection, resize math, quality ladder
  ├─ exif.ts       JPEG orientation read + apply
  ├─ codecs.ts     jSquash (WASM) codec bindings for the browser
  └─ naming.ts     scaled_ prefix logic
src/App.svelte   the UI (drag-drop, options, progress, results, downloads)
test/            vitest suite (mock codecs — runs in Node, no browser needed)
```

The engine is deliberately isolated from the UI and codecs (via a `Codecs` interface), so it's unit-tested in Node and can later be reused in a desktop (Tauri) build or a CLI.

## Roadmap

- [x] Web Worker offload for large batches (keep the UI buttery during big jobs)
- [x] Presets for common use cases (Tiny/WebP, Web, Email-JPEG, …)
- [x] Desktop app (Tauri 2) for Windows & Linux
- [ ] AVIF output (`@jsquash/avif`)
- [ ] Drag-to-reorder the queue

## Contributing

Contributions are welcome! Please read the [Contributing guide](./CONTRIBUTING.md)
before opening a PR, and note our [Code of Conduct](./CODE_OF_CONDUCT.md). For bugs and
ideas, use the [issue templates](https://github.com/therealshxd/scalir/issues/new/choose).
To report a security issue privately, see [SECURITY.md](./SECURITY.md).

## License

MIT — see [LICENSE](./LICENSE). Free forever; if it's useful, sponsorship is welcome but never required.
