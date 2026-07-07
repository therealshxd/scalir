<script lang="ts">
  const REPO = 'https://github.com/therealshxd/scalir';

  // "Try Scalir" jumps back to the home route and scrolls to the tool (same pattern as the nav).
  function gotoTool(e: Event) {
    e.preventDefault();
    location.hash = '#/';
    setTimeout(() => document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' }), 60);
  }
</script>

<div class="wrap">
  <!-- Intro -->
  <section class="section">
    <h1>Scalir features — a free, private bulk image compressor</h1>
    <p class="lead">
      Scalir is a <strong>free, private, in-browser image optimiser</strong>. Compress, resize and
      convert images in bulk — JPG, PNG, WebP, AVIF, HEIC and more — entirely on your own device.
      No uploads, no accounts, no server. Here's everything it can do, feature by feature.
    </p>
    <div class="sec-cta"><button class="cta" onclick={gotoTool}>Try Scalir</button>
      <a class="cta ghost" href="#/roadmap">See the roadmap</a></div>
  </section>

  <!-- Bulk compression -->
  <section class="section">
    <h2 class="sec-title">Bulk image compression</h2>
    <p class="sec-sub">Compress hundreds of images at once — fast, and in parallel</p>
    <p class="sec-desc">
      Drop in a whole folder and Scalir compresses every image at once. Heavy decode and encode work
      runs in a pool of Web Workers spread across all your CPU cores, so large batches finish quickly
      without ever freezing the page. It's built for real bulk image compression, not one file at a time.
    </p>
    <ul class="feat-list">
      <li>Process an entire folder of images in a single pass.</li>
      <li>Parallel encoding across every CPU core for fast batches.</li>
      <li>No per-image limits when you self-host or run the desktop app.</li>
      <li>Download everything as a ZIP or save straight to a folder.</li>
    </ul>
    <div class="sec-cta"><button class="cta" onclick={gotoTool}>Try Scalir</button></div>
  </section>

  <!-- Smart resizing -->
  <section class="section">
    <h2 class="sec-title">Smart resizing</h2>
    <p class="sec-sub">High-quality downscaling that never distorts your images</p>
    <p class="sec-desc">
      Resize images to exactly the dimensions you need using high-quality <strong>Lanczos3</strong>
      resampling. Cap the longest side, set an exact width or height, scale by percentage, or pick a
      common responsive width. Aspect ratio is always preserved and images are never cropped or upscaled.
    </p>
    <ul class="feat-list">
      <li>Longest-side cap, exact width, exact height, or percentage scale.</li>
      <li>Responsive width quick-picks: 640, 828, 1080, 1200 and 1920px.</li>
      <li>Lanczos3 resampling for crisp, artefact-free downscaling.</li>
      <li>Only ever shrinks — smaller images are left untouched.</li>
    </ul>
    <div class="sec-cta"><button class="cta" onclick={gotoTool}>Try Scalir</button></div>
  </section>

  <!-- Target-size compression -->
  <section class="section">
    <h2 class="sec-title">Target-size compression</h2>
    <p class="sec-sub">Hit a file-size budget without wrecking quality</p>
    <p class="sec-desc">
      Set a maximum file size and Scalir runs a quality binary-search to land the best-looking image
      that still fits under your limit. A quality floor stops it from ever going too far — if an image
      can't fit even at the floor, it's flagged rather than ruined.
    </p>
    <ul class="feat-list">
      <li>Set a max size in MB; Scalir compresses just enough to fit under it.</li>
      <li>Quality binary-search finds the best quality for your budget.</li>
      <li>A quality floor protects images from over-compression.</li>
      <li>Already-small files are copied through untouched, never re-encoded.</li>
    </ul>
    <div class="sec-cta"><button class="cta" onclick={gotoTool}>Try Scalir</button></div>
  </section>

  <!-- Before/after preview (new) -->
  <section class="section">
    <h2 class="sec-title">Before / after preview &amp; per-image quality</h2>
    <p class="sec-sub">See exactly what compression does — before you commit</p>
    <p class="sec-desc">
      Preview any image before optimising the batch. A draggable before/after slider wipes between the
      original and the optimised result, with zoom up to 200% so you can inspect compression artefacts
      up close. Not happy with one photo? Dial in its own quality and optimise just that image, or
      optimise the whole batch at your normal settings.
    </p>
    <ul class="feat-list">
      <li>Draggable before/after compare slider on every image.</li>
      <li>Zoom to 200% and pan to check fine detail and artefacts.</li>
      <li>Per-image quality slider re-encodes a single photo on the fly.</li>
      <li>Optimise one image on its own, or the whole batch together.</li>
    </ul>
    <div class="sec-cta"><button class="cta" onclick={gotoTool}>Try Scalir</button></div>
  </section>

  <!-- Modern formats -->
  <section class="section">
    <h2 class="sec-title">Modern formats — WebP &amp; AVIF</h2>
    <p class="sec-sub">Convert to the smallest web-ready formats</p>
    <p class="sec-desc">
      Convert JPG and PNG to <strong>WebP</strong> or <strong>AVIF</strong> for dramatically smaller
      web-ready files, or keep your original format. In Auto mode Scalir only switches to WebP when it
      meaningfully shrinks the file, so you always get the smaller result without guessing.
    </p>
    <ul class="feat-list">
      <li>Export to JPEG, PNG, WebP or AVIF — auto or forced.</li>
      <li>Auto mode converts to WebP only when it actually helps.</li>
      <li>AVIF for the very smallest files when you need them.</li>
      <li>Powered by the same jSquash/Squoosh WASM codecs, on-device.</li>
    </ul>
    <div class="sec-cta"><button class="cta" onclick={gotoTool}>Try Scalir</button></div>
  </section>

  <!-- Wide input support -->
  <section class="section">
    <h2 class="sec-title">Wide input support — HEIC, TIFF, GIF &amp; BMP</h2>
    <p class="sec-sub">Bring almost anything in, export a clean web format</p>
    <p class="sec-desc">
      Mix any inputs in one batch. Scalir decodes iPhone <strong>HEIC/HEIF</strong> photos, print-handoff
      <strong>TIFF</strong> files, <strong>GIF</strong> and <strong>BMP</strong>, and re-exports them as a
      web-ready JPEG, PNG, WebP or AVIF — so you can convert HEIC to JPG or WebP in seconds, no app required.
    </p>
    <ul class="feat-list">
      <li>Inputs: JPG, PNG, WebP, AVIF, HEIC/HEIF, GIF, TIFF and BMP.</li>
      <li>Convert iPhone HEIC photos to JPG or WebP instantly.</li>
      <li>Legacy TIFF and BMP re-exported as modern web formats.</li>
      <li>Animated GIFs use the first frame.</li>
    </ul>
    <div class="sec-cta"><button class="cta" onclick={gotoTool}>Try Scalir</button></div>
  </section>

  <!-- Presets & naming -->
  <section class="section">
    <h2 class="sec-title">Presets, remembered settings &amp; smart naming</h2>
    <p class="sec-sub">Set it up once, reuse it every time</p>
    <p class="sec-desc">
      Start from a built-in preset like Tiny or Web-optimized, or save your own with a title and
      description. Your last-used settings and custom presets persist between visits, and smart output
      naming adds prefixes, suffixes, lowercasing, slugifying and sequential numbering for clean,
      web-ready filenames.
    </p>
    <ul class="feat-list">
      <li>Built-in and custom presets, saved right in your browser.</li>
      <li>Settings are remembered between visits — no re-configuring.</li>
      <li>Prefix, suffix, lowercase, slugify and sequential numbering.</li>
      <li>Live filename preview as you type.</li>
    </ul>
    <div class="sec-cta"><button class="cta" onclick={gotoTool}>Try Scalir</button></div>
  </section>

  <!-- Privacy -->
  <section class="section">
    <h2 class="sec-title">Private by design — nothing is uploaded</h2>
    <p class="sec-sub">Your images never leave your device</p>
    <p class="sec-desc">
      Every step — decode, resize, compress and convert — happens locally in your browser. Your images
      are never uploaded to any server, and EXIF/GPS metadata is stripped on re-encode while image
      orientation is preserved. It's image compression that respects your privacy by default.
    </p>
    <ul class="feat-list">
      <li>100% client-side — no uploads, no accounts, no tracking of your files.</li>
      <li>EXIF/GPS metadata stripped on export; orientation kept correct.</li>
      <li>Works the same offline as online — your data stays with you.</li>
    </ul>
    <div class="sec-cta"><button class="cta" onclick={gotoTool}>Try Scalir</button></div>
  </section>

  <!-- Output & offline -->
  <section class="section">
    <h2 class="sec-title">Easy output &amp; offline use</h2>
    <p class="sec-sub">Get your files out however you like</p>
    <p class="sec-desc">
      Download your whole batch as a ZIP, or save straight to a folder on your computer with the File
      System Access API. Install Scalir as an offline <strong>PWA</strong>, or run the native desktop app
      for Windows and Linux — once loaded it works fully offline, with no browser tab required.
    </p>
    <ul class="feat-list">
      <li>Download all as a ZIP, or save directly to a folder.</li>
      <li>Installable PWA that works offline after the first load.</li>
      <li>Native desktop apps for Windows and Linux.</li>
      <li>Self-host with Docker for unlimited internal use.</li>
    </ul>
    <div class="sec-cta"><button class="cta" onclick={gotoTool}>Try Scalir</button>
      <a class="cta ghost" href="#/self-hosting">Self-host with Docker</a></div>
  </section>

  <!-- Supported formats -->
  <section class="section">
    <h2 class="sec-title">Supported formats</h2>
    <p class="sec-sub">Mix any inputs in one batch; export a clean, web-ready format</p>
    <div class="formats">
      <div class="fmt">
        <span class="fmt-label">Input</span>
        <ul class="chips">
          <li>JPG / JPEG</li><li>PNG</li><li>WebP</li><li>AVIF</li>
          <li>HEIC / HEIF</li><li>GIF</li><li>TIFF</li><li>BMP</li>
        </ul>
      </div>
      <div class="fmt">
        <span class="fmt-label">Output</span>
        <ul class="chips">
          <li>JPEG</li><li>PNG</li><li>WebP</li><li>AVIF</li>
          <li class="muted-chip">Auto or forced</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Built with -->
  <section class="section">
    <h2 class="sec-title">Built with</h2>
    <p class="sec-sub">Open-source, standards-based and 100% client-side</p>
    <ul class="feat-list tech">
      <li><strong>Svelte 5 + Vite</strong> — fast, lightweight front end.</li>
      <li><strong>jSquash WebAssembly codecs</strong> — MozJPEG, libwebp, libpng and libavif: the same
        codecs behind Squoosh, compiled to WASM.</li>
      <li><strong>libheif</strong> for HEIC/HEIF and <strong>UTIF</strong> for TIFF; GIF &amp; BMP decode
        natively in the browser.</li>
      <li><strong>Lanczos3 resampling</strong> (<code>@jsquash/resize</code>) for high-quality downscaling.</li>
      <li><strong>Web Workers</strong> — heavy encode/decode runs off the main thread, pooled across cores.</li>
      <li><strong>PWA</strong> (vite-plugin-pwa), <strong>File System Access API</strong> and
        <strong>JSZip</strong> for output; <strong>Tauri 2</strong> for native desktop builds.</li>
      <li><strong>MIT licensed</strong> — <a href={REPO} target="_blank" rel="noreferrer">source on GitHub</a>.</li>
    </ul>
    <div class="note privacy">
      <strong>Nothing leaves your device.</strong> Every step happens locally in your browser — your
      images are never uploaded.
    </div>
    <div class="sec-cta" style="margin-top:22px"><button class="cta" onclick={gotoTool}>Try Scalir</button>
      <a class="cta ghost" href="#/roadmap">See what's next</a></div>
  </section>
</div>

<style>
  h1 { font-size: 32px; margin: 0 0 10px; line-height: 1.15; }
  .lead { color: var(--muted); margin: 0 0 20px; font-size: 17px; max-width: 70ch; }
  .sec-desc { margin-bottom: 12px; line-height: 1.6; }
  .sec-cta { display: flex; gap: 12px; flex-wrap: wrap; }

  .feat-list { color: var(--muted); padding-left: 20px; margin: 0 0 18px; max-width: 72ch; }
  .feat-list li { margin-bottom: 8px; line-height: 1.55; }
  .feat-list li strong { color: var(--text); }
  .tech li { margin-bottom: 10px; }

  .formats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 4px 0 0; }
  .fmt-label { display: block; font-size: 12px; font-weight: 700; letter-spacing: .4px;
    text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
  .chips { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .chips li { background: #0f1218; border: 1px solid var(--line); color: var(--text);
    border-radius: 8px; padding: 6px 12px; font-size: 13px; font-weight: 600; margin: 0; }
  .chips li.muted-chip { color: var(--muted); font-weight: 500; }

  .note { background: var(--panel); border: 1px solid var(--line); border-left: 3px solid var(--ok);
    border-radius: 8px; padding: 12px 14px; margin: 20px 0 0; font-size: 14px; color: var(--text); }

  @media (max-width: 560px) { .formats { grid-template-columns: 1fr; } }
</style>
