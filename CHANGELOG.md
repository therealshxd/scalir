# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/therealshxd/scalir/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/therealshxd/scalir/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/therealshxd/scalir/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/therealshxd/scalir/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/therealshxd/scalir/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/therealshxd/scalir/releases/tag/v1.0.0
