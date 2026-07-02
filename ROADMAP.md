# Scalir Roadmap

Where Scalir is headed. Scalir is, and will always be, a **free, private,
100% in-browser** image tool — every feature below runs locally on your device, with
no uploads, no accounts, and no server doing the work.

This is a living document: order and scope can shift based on feedback. Got an idea or a
format you need? [Open an issue](https://github.com/therealshxd/scalir/issues/new/choose).

You can also read this on the site: **[scalir.org/#/roadmap](https://scalir.org/#/roadmap)**.

Want to try things before they ship? Preview the latest **work-in-progress build** at
**[scalir.shad.digital](https://scalir.shad.digital)**.

**Status key:** ✅ Shipped · 🔜 Next · 📋 Planned · 🔬 Exploring

---

## ✅ Shipped — v1.0.x

- Bulk image optimisation entirely in the browser (no uploads, ever).
- Resize by longest side + compress under a target file size.
- Input: **JPG, PNG, WebP, AVIF, HEIC/HEIF, GIF, TIFF, BMP** · Output: **JPG, PNG, WebP, AVIF** (Auto or forced).
- One-click presets, ZIP download, save-straight-to-folder, PWA / offline use.
- Self-hosting via Docker, and desktop builds (Windows / Linux).

---

## ✅ v1.1 — Faster bulk *(shipped)*

- **Parallel processing** — uses all your CPU cores instead of one, so large batches
  finish dramatically faster.
- **Cancel a run** mid-batch (already-optimised images are kept).
- **Copy-through** — images already within your limits are copied untouched instead of
  being needlessly re-encoded.

## ✅ v1.2 — More formats *(shipped)*

- **AVIF in and out** — the modern web format, often noticeably smaller than WebP.
- **GIF, TIFF and BMP input** — bring in legacy and print-handoff files and re-export
  them as optimised web formats. (Animated GIFs use the first frame.)

## 🔜 v1.3 — Web-design workflow *(in progress — shipping one feature per release)*

- ✅ **Remembered settings** — your last-used settings (and custom presets, now with titles,
  descriptions, and at-a-glance settings previews) persist between visits, so repeat batches
  are one click. *(shipped in 1.3.1–1.3.2)*
- ✅ **Smarter output naming** — prefix *and* suffix, lowercase, slugify spaces, optional
  sequential numbering for clean, web-ready filenames. *(shipped in 1.3.3)*
- ✅ **Flexible resize modes** — exact width, exact height, percentage scale, or a common
  responsive width (multi-size/`srcset` export comes later). *(shipped in 1.3.5)*
- **Before/after preview** — preview each result with a before/after compare and tweak a
  single image's quality before saving the batch.

---

## 🔬 Exploring / later

- **PDF compression** — a separate, fully client-side PDF compressor for shrinking
  image-heavy PDFs.
- **More formats** — JPEG XL, and SVG optimisation (minifying vector markup).

---

## Privacy, by design

Because Scalir re-encodes from raw pixels, **metadata like EXIF and GPS is stripped
automatically** on export — nothing about where or how a photo was taken rides along to
your website. That stays true for every feature on this roadmap.

---

*Want something that isn't here? [Suggest a feature.](https://github.com/therealshxd/scalir/issues/new/choose)*
