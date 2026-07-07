# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.8] - 2026-07-07

### Changed
- **Real page URLs for SEO.** The marketing site moved from hash routes (`/#/features`) to real
  paths (`/features`, `/roadmap`, …) so every page is an independent, indexable URL. Old
  `/#/…` links redirect automatically.

### Added
- **Per-page metadata + prerendering.** Each route is prerendered to static HTML with its own
  title, description, canonical and Open Graph tags, so search engines and AI agents get
  fully-formed pages (not an empty app shell).
- **Richer structured data** (Organization, WebSite, WebApplication, SoftwareSourceCode; per-page
  FAQ/Breadcrumb), a **multi-URL `sitemap.xml`**, an **`llms.txt`** for AI agents, and a proper
  **1200×630 social share image**.
- Staging is now `noindex` to avoid duplicate-content competition with the production site.

## [1.3.7] - 2026-07-07

### Added
- **Preview before you optimise.** Every queued image now has a **Preview** button that opens
  the before/after compare computed live from your current settings — so you can judge the
  quality *before* committing the whole batch, not just after.
- **Optimise one image, or the whole batch.** From the compare you can **Optimise this image**
  on its own (dial in its quality first) while the rest stay queued, or **Optimise whole batch**
  to run the normal size-target compression over everything.
- **Zoom & pan the compare.** Zoom the before/after inspector up to **200%** and drag to pan to
  check compression artefacts up close; the wipe stays pixel-aligned to the divider.

### Changed
- **Features page rebuilt as a landing page** — one section per feature with keyword-rich copy
  and quick "Try Scalir" jumps into the tool, for clearer structure and better SEO.

### Fixed
- **Per-page analytics.** Page views are now recorded per route on the hash-routed site —
  previously every visit registered as just the landing page. Key CTAs and buttons are also
  tagged for click analytics. *(Public site only; the desktop app, self-hosted copies and
  localhost still send nothing, and Do Not Track is honoured.)*

## [1.3.6] - 2026-07-06

### Added
- **Before/after preview.** Each optimised image now has a **Compare** button that opens a
  draggable before/after slider — wipe between the original and the optimised result to see
  exactly what the compression did.
- **Per-image quality.** In the compare view, a **quality slider** re-encodes that single image
  at a fixed quality (ignoring the batch size cap) so you can rescue an over-compressed photo
  before saving; **Apply** swaps it into the batch and it flows straight through to ZIP/Save.
- **Privacy-first analytics + privacy policy.** Cookieless, self-hosted [Umami](https://umami.is)
  usage stats on the public site only (the desktop app, self-hosted copies and localhost send
  nothing, and Do Not Track is honoured), plus a new **Privacy** page linked in the footer.

## [1.3.5] - 2026-07-02

### Added
- **Flexible resize modes.** Alongside longest-side, you can now resize by **exact width**,
  **exact height**, or a **percentage**, with one-tap **responsive width** presets
  (640 / 828 / 1080 / 1200 / 1920). Aspect ratio is always kept and nothing is ever upscaled —
  a source already smaller than your target is left untouched.

## [1.3.4] - 2026-07-02

### Added
- **Rename files.** A new **File name** field renames every output (kept between the prefix and
  suffix); leave it blank to keep the original name. Setting it switches on sequential numbering
  automatically so a batch can't collide.
- **Sliders** for **quality** and **max size** — drag or type, they stay in sync.

### Changed
- **Simpler by default.** Settings are now split into a **Simple** view (presets, max size,
  output format) with everything else tucked under an **Advanced** section, so casual use stays
  uncluttered while power users keep every dial.
- **Collapsible panels.** The Presets and Settings panels can be minimised, and the layout is
  remembered between visits.
- **Compact preset cards.** Presets show their title, description and savings at a glance; the
  full settings breakdown appears when a preset is selected or hovered.

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
