<script lang="ts">
  import { navigate, FEATURES_FAQ } from './seo';
  import Faq from './Faq.svelte';
  const REPO = 'https://github.com/therealshxd/scalir';
  const base = import.meta.env.BASE_URL;

  // "Try Scalir" jumps back to the home route and scrolls to the tool (same pattern as the nav).
  function gotoTool(e: Event) {
    e.preventDefault();
    navigate('/');
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
    <div class="sec-cta"><button class="cta" data-track="cta" data-track-value="features-try" onclick={gotoTool}>Try Scalir</button>
      <a class="cta ghost" href="/roadmap">See the roadmap</a></div>
  </section>

  <!-- Optimise images for web (intro keyword section) -->
  <section class="section">
    <h2 class="sec-title">Optimise images for web</h2>
    <p class="sec-sub">Faster pages, smaller files — with client-side image compression</p>
    <p class="sec-desc">
      Scalir helps you <strong>optimise images for web</strong> and <strong>optimize images for a
      website</strong> alike: compress, resize and convert in bulk so every asset loads fast. It's
      <strong>client side image compression</strong> — all the work happens in your browser, so
      there's no upload wait and your originals never leave your device.
    </p>
    <!-- svelte-ignore a11y_img_redundant_alt -->
    <img class="feat-img wide" src={base + 'img/compress-images-for-web-workflow.webp'}
      alt="Compressing images for a website to speed up page load"
      width="1200" height="600" loading="lazy" decoding="async" />
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
    <div class="sec-cta"><button class="cta" data-track="cta" data-track-value="features-try" onclick={gotoTool}>Try Scalir</button></div>
  </section>

  <!-- Smart resizing -->
  <section class="section">
    <h2 class="sec-title">Smart resizing — a bulk image resizer</h2>
    <p class="sec-sub">High-quality downscaling that never distorts your images</p>
    <p class="sec-desc">
      Use Scalir as a <strong>bulk image resizer</strong>: resize images online in batches, rescale
      images online by percentage, or cap the longest side. High-quality <strong>Lanczos3</strong>
      downscaling means you <strong>resize images without losing quality</strong> — aspect ratio is
      always kept, and images are only ever downscaled, never upscaled.
    </p>
    <!-- svelte-ignore a11y_img_redundant_alt -->
    <img class="feat-img" src={base + 'img/resize-images-online-lanczos.webp'}
      alt="Resizing images online to a smaller dimension while keeping quality"
      width="1000" height="600" loading="lazy" decoding="async" />
    <h3 class="kw-h">A batch image resizer for a whole folder</h3>
    <ul class="feat-list">
      <li>Resize multiple images at once, straight from a folder.</li>
      <li>Reduce image dimensions to a responsive width (640, 828, 1080, 1200 or 1920px).</li>
      <li>Downscale images online with no visible quality loss.</li>
      <li>Bulk resize photos by exact width, exact height or percentage scale.</li>
    </ul>
    <div class="sec-cta"><button class="cta" data-track="cta" data-track-value="features-try" onclick={gotoTool}>Try Scalir</button></div>
  </section>

  <!-- Target-size compression -->
  <section class="section">
    <h2 class="sec-title">Target-size compression</h2>
    <p class="sec-sub">Hit a file-size budget without wrecking quality</p>
    <p class="sec-desc">
      Set a budget and Scalir will <strong>compress an image to a specific size</strong> — for example
      <strong>compress an image under 1 MB</strong> — using a quality binary-search that
      <strong>compresses JPG without losing quality</strong> you can see. Prefer lossless? You can
      <strong>compress PNG online</strong> too, or let Auto pick the smallest format for you.
    </p>
    <h3 class="kw-h">Compress an image to a target size</h3>
    <ul class="feat-list">
      <li>Set a max size in MB; Scalir compresses just enough to fit under it.</li>
      <li>Compress an image to a target size without visibly wrecking quality.</li>
      <li>Compress JPG without losing quality, or compress PNG online instead.</li>
      <li>A quality floor protects images from over-compression; tiny files are copied through untouched.</li>
    </ul>
    <div class="sec-cta"><button class="cta" data-track="cta" data-track-value="features-try" onclick={gotoTool}>Try Scalir</button></div>
  </section>

  <!-- Comparison table (engagement / scannability) -->
  <section class="section">
    <h2 class="sec-title">Which preset for which task?</h2>
    <p class="sec-sub">Pick a starting point, then fine-tune if you need to</p>
    <div class="cmp-wrap">
      <table class="cmp-table">
        <thead>
          <tr><th>Task</th><th>Preset to use</th><th>Typical result</th></tr>
        </thead>
        <tbody>
          <tr><td>Resize images online for a blog</td><td>Web optimized (1920px, WebP)</td><td>~70% smaller</td></tr>
          <tr><td>Compress image under 1 MB</td><td>Web optimized / custom max-size</td><td>≤ 1 MB</td></tr>
          <tr><td>Convert HEIC to JPG</td><td>High quality → JPEG</td><td>iPhone-ready JPG</td></tr>
          <tr><td>Bulk convert images to WebP</td><td>Tiny (WebP)</td><td>~85% smaller</td></tr>
        </tbody>
      </table>
    </div>
    <div class="sec-cta"><button class="cta" data-track="cta" data-track-value="features-try" onclick={gotoTool}>Try Scalir</button></div>
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
    <div class="sec-cta"><button class="cta" data-track="cta" data-track-value="features-try" onclick={gotoTool}>Try Scalir</button></div>
  </section>

  <!-- Modern formats -->
  <section class="section">
    <h2 class="sec-title">Modern formats — WebP &amp; AVIF</h2>
    <p class="sec-sub">Convert to the smallest web-ready formats</p>
    <p class="sec-desc">
      <strong>Convert JPG to WebP</strong>, <strong>convert PNG to WebP</strong>, or
      <strong>convert images to AVIF</strong> for the smallest web-ready files. Scalir will
      <strong>batch convert images</strong> in one pass, and decodes iPhone photos so you can
      <strong>convert HEIC to JPG</strong> or WebP in seconds. In Auto mode it only switches format
      when it meaningfully shrinks the file, so you always get the smaller result without guessing.
    </p>
    <h3 class="kw-h">Bulk convert images to WebP or AVIF</h3>
    <ul class="feat-list">
      <li>Convert JPG to WebP or PNG to WebP, or export straight to AVIF.</li>
      <li>Bulk convert images to WebP across a whole folder in one pass.</li>
      <li>Auto mode converts to WebP only when it actually helps.</li>
      <li>Powered by the same jSquash/Squoosh WASM codecs, on-device.</li>
    </ul>
    <div class="sec-cta"><button class="cta" data-track="cta" data-track-value="features-try" onclick={gotoTool}>Try Scalir</button></div>
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
    <!-- svelte-ignore a11y_img_redundant_alt -->
    <img class="feat-img" src={base + 'img/convert-heic-to-jpg-iphone.webp'}
      alt="Converting an iPhone HEIC photo to a web-ready JPG"
      width="1000" height="600" loading="lazy" decoding="async" />
    <ul class="feat-list">
      <li>Inputs: JPG, PNG, WebP, AVIF, HEIC/HEIF, GIF, TIFF and BMP.</li>
      <li>Convert iPhone HEIC photos to JPG or WebP instantly.</li>
      <li>Legacy TIFF and BMP re-exported as modern web formats.</li>
      <li>Animated GIFs use the first frame.</li>
    </ul>
    <div class="sec-cta"><button class="cta" data-track="cta" data-track-value="features-try" onclick={gotoTool}>Try Scalir</button></div>
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
    <div class="sec-cta"><button class="cta" data-track="cta" data-track-value="features-try" onclick={gotoTool}>Try Scalir</button></div>
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
    <div class="sec-cta"><button class="cta" data-track="cta" data-track-value="features-try" onclick={gotoTool}>Try Scalir</button></div>
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
    <div class="sec-cta"><button class="cta" data-track="cta" data-track-value="features-try" onclick={gotoTool}>Try Scalir</button>
      <a class="cta ghost" href="/self-hosting">Self-host with Docker</a></div>
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

  <!-- FAQ -->
  <section class="section">
    <h2 class="sec-title">Features FAQ</h2>
    <p class="sec-sub">Resizing, target-size compression and format conversion, answered</p>
    <Faq items={FEATURES_FAQ} />
    <div class="sec-cta" style="margin-top:22px"><button class="cta" data-track="cta" data-track-value="features-try" onclick={gotoTool}>Try Scalir</button></div>
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
    <div class="sec-cta" style="margin-top:22px"><button class="cta" data-track="cta" data-track-value="features-try" onclick={gotoTool}>Try Scalir</button>
      <a class="cta ghost" href="/roadmap">See what's next</a></div>
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

  /* keyword sub-heading that leads a bullet list */
  .kw-h { font-size: 15px; font-weight: 700; color: var(--text); margin: 4px 0 10px; }

  /* section illustrations */
  .feat-img { width: 100%; max-width: 640px; height: auto; display: block; margin: 4px 0 18px;
    border: 1px solid var(--line); border-radius: 14px; }
  .feat-img.wide { max-width: 820px; }

  /* comparison table */
  .cmp-wrap { overflow-x: auto; margin: 6px 0 4px; }
  .cmp-table { width: 100%; border-collapse: collapse; font-size: 14.5px; min-width: 520px; }
  .cmp-table th, .cmp-table td { text-align: left; padding: 12px 14px; border-bottom: 1px solid var(--line); }
  .cmp-table thead th { color: var(--accent); font-weight: 700; font-size: 12.5px;
    letter-spacing: .3px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  .cmp-table tbody tr:last-child td { border-bottom: 0; }
  .cmp-table td:first-child { color: var(--text); font-weight: 600; }
  .cmp-table td { color: var(--muted); }

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
