<script lang="ts">
  const REPO = 'https://github.com/therealshxd/scalir';
</script>

<div class="wrap doc">
  <section class="section" style="border-top:0">
    <h1>Features &amp; tech</h1>
    <p class="lead">
      Scalir is a <strong>free, private, in-browser image optimiser</strong> — bulk compress,
      resize and convert images entirely on your device. No uploads, no accounts, no server.
      Here's what it supports and how it's built.
    </p>

    <div class="note">
      Want a format or capability that isn't here yet? Check the
      <a href="#/roadmap">roadmap</a> or <a href={REPO + '/issues/new/choose'} target="_blank" rel="noreferrer">open an issue</a>.
    </div>

    <!-- Supported formats -->
    <div class="card">
      <h3>Supported formats</h3>
      <p>Mix any inputs in one batch and export to a web-ready format.</p>
      <div class="formats">
        <div class="fmt">
          <span class="fmt-label">Input</span>
          <ul class="chips">
            <li>JPG / JPEG</li>
            <li>PNG</li>
            <li>WebP</li>
            <li>HEIC / HEIF</li>
          </ul>
        </div>
        <div class="fmt">
          <span class="fmt-label">Output</span>
          <ul class="chips">
            <li>JPEG</li>
            <li>PNG</li>
            <li>WebP</li>
            <li class="muted-chip">Auto or forced</li>
          </ul>
        </div>
      </div>
      <p class="fine">
        HEIC/HEIF (iPhone photos) are decoded and saved as JPEG or WebP. <strong>AVIF</strong>
        plus <strong>GIF, TIFF and BMP</strong> input are <a href="#/roadmap">coming next</a>.
      </p>
    </div>

    <!-- What it does -->
    <div class="card">
      <h3>What it does</h3>
      <ul>
        <li><strong>Bulk optimisation in parallel</strong> — processes many images at once
          across your CPU cores, so large batches finish fast.</li>
        <li><strong>Smart resizing</strong> — caps the longest side using high-quality
          <strong>Lanczos3</strong> resampling, keeping aspect ratio (never upscales).</li>
        <li><strong>Target-size compression</strong> — a quality binary-search lands the
          best-looking file that still fits under your size limit.</li>
        <li><strong>Modern formats</strong> — optionally converts to <strong>WebP</strong> when
          it meaningfully shrinks the file.</li>
        <li><strong>Copy-through</strong> — images already within your limits are copied
          untouched instead of needlessly re-encoded.</li>
        <li><strong>Privacy by default</strong> — runs fully on-device; nothing is uploaded and
          metadata (EXIF/GPS) is stripped on re-encode. EXIF orientation is honoured.</li>
        <li><strong>Easy output</strong> — download everything as a ZIP or save straight to a
          folder. Installable as an offline <strong>PWA</strong>.</li>
      </ul>
    </div>

    <!-- Built with -->
    <div class="card">
      <h3>Built with</h3>
      <p>Open-source, standards-based, and 100% client-side.</p>
      <ul class="tech">
        <li><strong>Svelte 5 + Vite</strong> — fast, lightweight front end.</li>
        <li><strong>jSquash WebAssembly codecs</strong> — MozJPEG (JPEG), libwebp (WebP),
          libpng (PNG): the same codecs behind Squoosh, compiled to WASM.</li>
        <li><strong>libheif</strong> — HEIC/HEIF decoding.</li>
        <li><strong>Lanczos3 resampling</strong> (<code>@jsquash/resize</code>) — high-quality
          downscaling.</li>
        <li><strong>Web Workers</strong> — heavy encode/decode runs off the main thread, in a
          pool across cores.</li>
        <li><strong>PWA</strong> (vite-plugin-pwa) — works offline after first load.</li>
        <li><strong>File System Access API</strong> — optional save-to-folder; <strong>JSZip</strong>
          for ZIP downloads.</li>
        <li><strong>Tauri 2</strong> — native desktop builds for Windows and Linux.</li>
        <li><strong>MIT licensed</strong> — <a href={REPO} target="_blank" rel="noreferrer">source on GitHub</a>.</li>
      </ul>
    </div>

    <div class="note privacy">
      <strong>Nothing leaves your device.</strong> Every step — decode, resize, compress,
      convert — happens locally in your browser. Your images are never uploaded.
    </div>

    <div class="sec-cta" style="margin-top:22px">
      <a class="cta" href="#/">Try Scalir</a>
      <a class="cta ghost" href="#/roadmap">See the roadmap</a>
    </div>
    <p class="lead" style="margin-top:18px"><a href="#/">← Back to the tool</a></p>
  </section>
</div>

<style>
  ul { color: var(--muted); padding-left: 20px; margin: 8px 0 0; }
  ul li { margin-bottom: 8px; line-height: 1.5; }
  ul li strong { color: var(--text); }
  .tech li { margin-bottom: 10px; }

  .formats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 4px 0 12px; }
  .fmt-label { display: block; font-size: 12px; font-weight: 700; letter-spacing: .4px;
    text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
  .chips { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .chips li { background: #0f1218; border: 1px solid var(--line); color: var(--text);
    border-radius: 8px; padding: 6px 12px; font-size: 13px; font-weight: 600; margin: 0; }
  .chips li.muted-chip { color: var(--muted); font-weight: 500; }
  .fine { font-size: 13px; color: var(--muted); margin: 4px 0 0; }
  .fine a, .note a { color: var(--accent); }

  .note { background: var(--panel); border: 1px solid var(--line); border-left: 3px solid var(--accent);
    border-radius: 8px; padding: 12px 14px; margin: 0 0 22px; font-size: 14px; color: var(--text); }
  .note.privacy { border-left-color: var(--ok); margin: 22px 0 0; }
  .sec-cta { display: flex; gap: 12px; flex-wrap: wrap; }
  @media (max-width: 560px) { .formats { grid-template-columns: 1fr; } }
</style>
