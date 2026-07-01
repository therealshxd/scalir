# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.3] - 2026-07-01

### Added
- **Smarter output naming.** In addition to a prefix, you can now add a **suffix**, force
  **lowercase** filenames, **slugify** (turn spaces into dashes and drop unsafe characters),
  and add **sequential numbering** (e.g. `scaled_beach-photo-01.jpg`, zero-padded to the batch
  size). A live example shows how your settings shape the filename as you type.

## [1.3.2] - 2026-07-01

### Added
- **Described custom presets.** Saving a preset now takes a **title and an optional
  description**, both shown on the preset.
- **Presets are now informative cards.** Every preset — built-in or custom — is shown as a card
  with its title, description, and exactly what it applies (max dimension, max size, output
  format, quality floor) all visible inline. No hover needed, so it reads clearly on mobile.

## [1.3.1] - 2026-07-01

First slice of the **v1.3 "Web-design workflow"** milestone, shipped as its own release.

### Added
- **Remembered settings.** Your last-used options (dimensions, size target, format, quality
  floor, prefix, WebP toggle) now persist between visits, so repeat batches are one click.
  Saved locally in your browser — nothing leaves your device.
- **Custom presets.** Save the current settings as a named preset with **"+ Save current
  settings as a preset"**, then apply it from the Quick presets row any time. Custom presets
  sit alongside the built-ins and can be deleted individually.

## [1.2.1] - 2026-06-30

### Fixed
- Excluded the AVIF encoder assets from the desktop app's PWA precache, so the app build no
  longer bloats its offline cache with encoders it loads on demand.

## [1.2.0] - 2026-06-30

### Added
- **AVIF input and output**, plus **GIF, TIFF and BMP input** — bring in legacy/print-handoff
  files and re-export them as optimised web formats. (Animated GIFs use the first frame.)
- Exposed the AVIF output option in the tool and listed the new input formats.

### Changed
- SEO-focused landing page redesign.

### Fixed
- Donate button text was invisible (cyan on cyan) on the About page.

## [1.1.3] - 2026-06-29

### Added
- **Desktop auto-updater.** The Windows and Linux desktop apps now check GitHub Releases on
  launch and show an in-app "Install & restart" prompt when a newer version is available
  (updates are cryptographically signed and verified). Built on the Tauri updater plugin.

### Changed
- Consolidated the separate Windows/Linux release workflows into a single matrix
  `release.yml` so each tag publishes one complete, signed updater manifest (`latest.json`).

> **Note:** auto-update only works from builds that already include it. Existing 1.1.2 (and
> earlier) desktop installs must download 1.1.3 **once** manually; from 1.1.3 onward they
> update in place. On Linux, only the AppImage self-updates (`.deb`/`.rpm` update via their
> package manager).

## [1.1.2] - 2026-06-29

### Added
- Roadmap page (and `ROADMAP.md`) now link to the live **work-in-progress preview build**
  at scalir.shad.digital, so people can try features before they ship.
- README **"Live previews"** section documenting the two-branch deployment setup
  (`main` → scalir.org, `dev` → scalir.shad.digital) and a matching maintainer note in
  CONTRIBUTING.md.

## [1.1.1] - 2026-06-29

### Added
- **Features** page (`#/features`) listing supported formats and the technology stack
  (jSquash/MozJPEG/libwebp/libpng, libheif, Lanczos3, Web Workers, PWA, Tauri).

### Changed
- Roadmap (page + `ROADMAP.md`) now reflects **v1.1 as shipped** (parallel processing,
  Cancel, copy-through) and promotes the formats milestone to next.
- Refreshed landing-page marketing copy and added SEO metadata (description, keywords,
  Open Graph, Twitter card, canonical URL). Personal sections left unchanged.

## [1.1.0] - 2026-06-28

### Added
- **Parallel processing** — batches now run across a pool of Web Workers
  (one per core, balanced: `hardwareConcurrency − 1`, capped at 6) instead of one image at
  a time, dramatically faster on large batches. Results still render in original order.
- **Cancel** button to stop a run mid-batch; already-optimised images are kept.
- Public **Roadmap** page (`#/roadmap`) on the site and a `ROADMAP.md` at the repo root,
  outlining planned versions (parallel processing, AVIF + more formats, web-design
  workflow features) and exploratory ideas (PDF compression).

### Fixed
- Images already under the size cap **and** within the max-dimension are now **copied
  through unchanged** instead of re-encoded — re-encoding at top quality could needlessly
  enlarge or rewrite an already-compliant file. They still appear in the batch output
  (ZIP / save-to-folder) alongside the optimised images.

## [1.0.3] - 2026-06-28

### Added
- Donation link (PayPal) on the landing page, replacing the "Donations Coming Soon"
  placeholder; opens in a new tab.

### Changed
- Production domain updated to **scalir.org** across the app UI, Docker Compose, and docs.

## [1.0.2] - 2026-06-28

### Changed
- Refreshed dependencies to latest in-range versions (Vite, Svelte, svelte-check,
  Playwright, @types/node). `npm audit` reports 0 vulnerabilities.
- Pinned the package manager to **npm 11** via `packageManager` + `engines`, applied
  across local (Corepack), Docker images, and CI so all builds use the same npm.

### Added
- `dev` / `main` branching model with a documented release workflow
  (see CONTRIBUTING.md).
- `scripts/sync-version.mjs` + an npm `version` lifecycle hook that keeps
  `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` in lockstep.
- Continuous Integration workflow (`.github/workflows/ci.yml`) running type-check,
  tests, and a production build on pull requests and pushes to `dev`/`main`.
- This CHANGELOG.

## [1.0.1] - 2026-06-25

### Added
- Five one-click compression presets (Tiny/WebP, Web optimized, Email & sharing/JPEG,
  High quality, Smaller file) with typical space-saving indicators.
- Output-format control (Auto / JPEG / PNG / WebP) so presets can lock a format.
- Per-option inline hints and a collapsible "What do these mean?" help panel.
- A 4-step "How it works" card row on the homepage hero.
- GitHub community health files: Code of Conduct (Contributor Covenant 2.1),
  Contributing guide, Security policy, issue forms, and a pull-request template.

### Changed
- Filesize targeting now uses a binary search over quality to land at the highest
  quality that still fits under the size cap, instead of stepping a coarse quality ladder.

## [1.0.0] - 2026-06-24

### Added
- Initial release: in-browser bulk image optimiser — resize, compress, and convert
  (JPEG/PNG/WebP, HEIC input) entirely client-side with no uploads.
- Web Worker processing, ZIP / save-to-folder output, EXIF orientation handling.
- Desktop builds (Tauri 2) for Windows and Linux; Docker images for self-hosting.

[Unreleased]: https://github.com/therealshxd/scalir/compare/v1.1.3...HEAD
[1.1.3]: https://github.com/therealshxd/scalir/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/therealshxd/scalir/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/therealshxd/scalir/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/therealshxd/scalir/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/therealshxd/scalir/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/therealshxd/scalir/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/therealshxd/scalir/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/therealshxd/scalir/releases/tag/v1.0.0
