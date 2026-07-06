<script lang="ts">
  const REPO = 'https://github.com/therealshxd/scalir';
  const ISSUES = REPO + '/issues/new/choose';
  const ROADMAP_MD = REPO + '/blob/main/ROADMAP.md';
  const PREVIEW = 'https://scalir.shad.digital';
</script>

<div class="wrap doc">
  <section class="section" style="border-top:0">
    <h1>Roadmap</h1>
    <p class="lead">
      Where Scalir is headed. Everything below runs the same way Scalir always has —
      <strong>free, private, and 100% in your browser</strong>: no uploads, no accounts, no
      server doing the work.
    </p>

    <div class="note">
      This is a living plan — order and scope can shift based on feedback. Got an idea or a
      format you need? <a href={ISSUES} target="_blank" rel="noreferrer">Suggest a feature</a>.
      You can also read this <a href={ROADMAP_MD} target="_blank" rel="noreferrer">on GitHub</a>.
      Want to try things before they ship? Preview the latest
      <a href={PREVIEW} target="_blank" rel="noreferrer">work-in-progress build</a> at
      scalir.shad.digital.
    </div>

    <!-- Shipped -->
    <div class="card">
      <h3>Available now <span class="badge shipped">Shipped</span></h3>
      <p>The free tool you're using today.</p>
      <ul>
        <li>Bulk image optimisation entirely in the browser — nothing is ever uploaded.</li>
        <li>Resize by longest side and compress under a target file size.</li>
        <li>Input: JPG, PNG, WebP, AVIF, HEIC/HEIF, GIF, TIFF, BMP · Output: JPG, PNG, WebP,
          AVIF (Auto or forced).</li>
        <li>One-click presets, ZIP download, save-to-folder, offline PWA, self-hosting.</li>
      </ul>
    </div>

    <!-- v1.1 -->
    <div class="card">
      <h3>v1.1 — Faster bulk <span class="badge shipped">Shipped</span></h3>
      <ul>
        <li><strong>Parallel processing</strong> — uses all your CPU cores instead of one, so
          large batches finish dramatically faster.</li>
        <li><strong>Cancel a run</strong> mid-batch (already-optimised images are kept).</li>
        <li><strong>Copy-through</strong> — images already within your limits are copied
          untouched instead of being needlessly re-encoded.</li>
      </ul>
    </div>

    <!-- v1.2 -->
    <div class="card">
      <h3>v1.2 — More formats <span class="badge shipped">Shipped</span></h3>
      <ul>
        <li><strong>AVIF in and out</strong> — the modern web format, often noticeably
          smaller than WebP.</li>
        <li><strong>GIF, TIFF and BMP input</strong> — bring in legacy and print-handoff
          files and re-export them as optimised web formats. (Animated GIFs use the first
          frame.)</li>
      </ul>
    </div>

    <!-- v1.3 -->
    <div class="card">
      <h3>v1.3 — Web-design workflow <span class="badge shipped">Shipped</span></h3>
      <p class="sub">Shipped one feature at a time, each as its own release.</p>
      <ul>
        <li><strong>Remembered settings</strong> — your last-used settings and custom presets
          (with titles, descriptions, and at-a-glance settings previews) persist between
          visits. <span class="badge shipped">Shipped in 1.3.1–1.3.2</span></li>
        <li><strong>Smarter output naming</strong> — prefix and suffix, lowercase, slugify
          spaces, optional sequential numbering for clean, web-ready filenames.
          <span class="badge shipped">Shipped in 1.3.3</span></li>
        <li><strong>Flexible resize modes</strong> — exact width, exact height, percentage
          scale, or a common responsive width (multi-size export comes later).
          <span class="badge shipped">Shipped in 1.3.5</span></li>
        <li><strong>Before/after preview</strong> — preview each result with a before/after
          compare and tweak a single image's quality before saving the batch.
          <span class="badge shipped">Shipped in 1.3.6</span></li>
      </ul>
    </div>

    <!-- Exploring -->
    <div class="card">
      <h3>Exploring / later <span class="badge exploring">Exploring</span></h3>
      <ul>
        <li><strong>PDF compression</strong> — a separate, fully client-side PDF compressor
          for shrinking image-heavy PDFs.</li>
        <li><strong>More formats</strong> — JPEG XL, and SVG optimisation (minifying vector
          markup).</li>
      </ul>
    </div>

    <div class="note privacy">
      <strong>Privacy, by design.</strong> Because Scalir re-encodes from raw pixels,
      metadata like EXIF and GPS is stripped automatically on export — and that stays true
      for every feature on this roadmap.
    </div>

    <p class="lead" style="margin-top:24px">
      Want something that isn't here?
      <a href={ISSUES} target="_blank" rel="noreferrer">Suggest a feature</a>.
      <a href="#/">← Back to the tool</a>
    </p>
  </section>
</div>

<style>
  .sub { color: var(--muted); font-size: 13px; margin: 6px 0 0; }
  ul { color: var(--muted); padding-left: 20px; margin: 8px 0 0; }
  ul li { margin-bottom: 8px; line-height: 1.5; }
  ul li strong { color: var(--text); }
  .badge.shipped { color: var(--ok); background: rgba(56,193,114,.14); border-color: #1e5c38; }
  .badge.exploring { color: var(--muted); background: rgba(154,163,178,.12); border-color: var(--line); }
  .note { background: var(--panel); border: 1px solid var(--line); border-left: 3px solid var(--accent);
    border-radius: 8px; padding: 12px 14px; margin: 0 0 22px; font-size: 14px; color: var(--text); }
  .note.privacy { border-left-color: var(--ok); margin: 22px 0 0; }
  .note a { color: var(--accent); }
</style>
