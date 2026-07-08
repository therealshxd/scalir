<script lang="ts">
  import Tool from './Tool.svelte';
  const base = import.meta.env.BASE_URL;
  function scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }
</script>

<!-- Hero -->
<header class="hero">
  <img src={base + 'pwa-192.png'} alt="Scalir" width="76" height="76" fetchpriority="high" />
  <h1><span class="grad">Free Bulk Image Compressor</span> — Scalir</h1>
  <p>
    Compress, resize and convert images in bulk — right in your browser. JPG, PNG, WebP, AVIF
    and more. No uploads, no sign-up, completely free. Private by design: every image is
    processed on your own device.
  </p>
  <div class="ctas">
    <button class="cta" data-track="cta" data-track-value="home-compress" onclick={() => scrollTo('tool')}>Compress images now</button>
    <a class="cta ghost" href="/features">See features</a>
  </div>

  <ol class="steps">
    <li class="step">
      <span class="step-num">1</span>
      <h2>Add your images</h2>
      <p>Drop in the images you want to compress, or choose a whole folder — JPG, PNG, WebP, AVIF, HEIC, GIF, TIFF or BMP.</p>
    </li>
    <li class="step">
      <span class="step-num">2</span>
      <h2>Pick a preset or tweak</h2>
      <p>Start from a preset like Tiny or Web optimized, then fine-tune size, quality and output format if you need to.</p>
    </li>
    <li class="step">
      <span class="step-num">3</span>
      <h2>Compress</h2>
      <p>Hit Optimise — everything runs locally on your device across all your CPU cores. Nothing is uploaded.</p>
    </li>
    <li class="step">
      <span class="step-num">4</span>
      <h2>Save your files</h2>
      <p>Download them all as a .zip, or save straight to a folder on your computer.</p>
    </li>
  </ol>
</header>

<div class="wrap">
  <!-- The tool -->
  <section class="section">
    <h2 class="sec-title">Compress &amp; resize your images</h2>
    <p class="sec-sub">Resize over 2000px · compress under 1&nbsp;MB · saved with a scaled_ prefix</p>
    <Tool />
  </section>

  <!-- Benefits / why Scalir -->
  <section class="section">
    <h2 class="sec-title">A free image optimiser that respects your privacy</h2>
    <p class="sec-sub">Bulk image compression, resizing and conversion — 100% in your browser</p>
    <div class="grid">
      <div class="card">
        <h3>Bulk image compression</h3>
        <p>Compress hundreds of images at once. Scalir uses all your CPU cores in parallel, so large batches finish fast — with no per-image limits when you self-host.</p>
      </div>
      <div class="card">
        <h3>Smart resizing</h3>
        <p>Cap the longest side with high-quality Lanczos3 resampling. Aspect ratio is always kept and images are never cropped or upscaled.</p>
      </div>
      <div class="card">
        <h3>Modern formats — WebP &amp; AVIF</h3>
        <p>Convert JPG and PNG to WebP or AVIF for the smallest possible web-ready files, or keep your original format. Mix any inputs in one batch.</p>
      </div>
      <div class="card">
        <h3>Private — nothing uploaded</h3>
        <p>Every image is decoded, resized and compressed on your own device. Nothing is ever uploaded, and EXIF/GPS metadata is stripped on export.</p>
      </div>
      <div class="card">
        <h3>Free &amp; open source</h3>
        <p>No accounts, no watermarks, no paywall. Scalir is MIT-licensed and self-hostable with Docker for unlimited use behind your firewall.</p>
      </div>
      <div class="card">
        <h3>Works offline</h3>
        <p>Install Scalir as a PWA or run the desktop app. Once loaded it works fully offline — fast image compression with no browser tab required.</p>
      </div>
    </div>
  </section>

  <!-- Supported formats -->
  <section class="section">
    <h2 class="sec-title">Supported formats</h2>
    <p class="sec-sub">Bring almost anything in; export a clean, web-ready format</p>
    <div class="formats">
      <div class="fmt">
        <span class="fmt-label">Input</span>
        <ul class="chips">
          <li>JPG / JPEG</li>
          <li>PNG</li>
          <li>WebP</li>
          <li>AVIF</li>
          <li>HEIC / HEIF</li>
          <li>GIF</li>
          <li>TIFF</li>
          <li>BMP</li>
        </ul>
      </div>
      <div class="fmt">
        <span class="fmt-label">Output</span>
        <ul class="chips">
          <li>JPEG</li>
          <li>PNG</li>
          <li>WebP</li>
          <li>AVIF</li>
          <li class="muted-chip">Auto or forced</li>
        </ul>
      </div>
    </div>
    <p class="fine">Animated GIFs use the first frame. <a href="/features">See all features &amp; tech →</a></p>
  </section>

  <!-- Self-hosting -->
  <section class="section">
    <h2 class="sec-title">Host it yourself</h2>
    <p class="sec-sub">Private, self-hosted bulk image optimisation</p>
    <p class="sec-desc">
      Scalir is completely free with no image limits. Self-host it with Docker in minutes to run bulk
      image compression internally, behind your firewall, or as part of your own pipeline — no external
      dependencies and no data ever leaving your network.
    </p>
    <div class="sec-cta"><a class="cta" data-track="cta" data-track-value="home-self-host" href="/self-hosting">Deploy with Docker</a></div>
  </section>

  <!-- Local -->
  <section class="section">
    <h2 class="sec-title">Local installation</h2>
    <p class="sec-sub">Fast, offline image optimisation on your machine</p>
    <p class="sec-desc">
      Prefer to keep everything local? Install the desktop app for Windows or Linux, or run it with
      Docker on your own machine. Scalir was built as a local-first tool for speed — optimise images
      offline, with no browser tab required.
    </p>
    <div class="sec-cta"><a class="cta" data-track="cta" data-track-value="home-download" href="/download">Setup locally</a></div>
  </section>

  <!-- FAQ -->
  <section class="section">
    <h2 class="sec-title">Frequently asked questions</h2>
    <p class="sec-sub">Quick answers about compressing images with Scalir</p>
    <div class="faq">
      <div class="qa">
        <h3>Is Scalir free?</h3>
        <p>Yes — Scalir is completely free and open source under the MIT license. There are no accounts, no watermarks and no paid tier. Self-host it for unlimited use.</p>
      </div>
      <div class="qa">
        <h3>Are my images uploaded to a server?</h3>
        <p>No. Every image is compressed, resized and converted entirely in your browser, on your own device. Nothing is ever uploaded, so your images stay completely private.</p>
      </div>
      <div class="qa">
        <h3>What image formats can I compress?</h3>
        <p>You can bring in JPG, PNG, WebP, AVIF, HEIC/HEIF, GIF, TIFF and BMP, and export to JPEG, PNG, WebP or AVIF — automatically or forced to a format you choose.</p>
      </div>
      <div class="qa">
        <h3>Can I compress images in bulk?</h3>
        <p>Yes. Scalir is built for bulk image compression — drop in a whole folder and it processes everything in parallel across your CPU cores, then hands back a ZIP or saves to a folder.</p>
      </div>
      <div class="qa">
        <h3>Does it work offline?</h3>
        <p>Yes. Scalir is an installable PWA (and has a desktop app for Windows and Linux). After the first load it works fully offline.</p>
      </div>
      <div class="qa">
        <h3>Is there a file-size or image limit?</h3>
        <p>The hosted app has a small soft per-session limit as a gentle nudge. The self-hosted and desktop builds are completely unlimited.</p>
      </div>
    </div>
  </section>
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 14px; }
  .grid .card { margin: 0; }
  .grid .card h3 { margin: 0 0 8px; font-size: 17px; }
  .grid .card p { color: var(--muted); margin: 0; line-height: 1.55; font-size: 14.5px; }

  .formats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 14px 0 12px; }
  .fmt-label { display: block; font-size: 12px; font-weight: 700; letter-spacing: .4px;
    text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
  .chips { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .chips li { background: #0f1218; border: 1px solid var(--line); color: var(--text);
    border-radius: 8px; padding: 6px 12px; font-size: 13px; font-weight: 600; }
  .chips li.muted-chip { color: var(--muted); font-weight: 500; }
  .fine { font-size: 13px; color: var(--muted); margin: 4px 0 0; }
  .fine a { color: var(--accent); }

  .faq { display: grid; gap: 14px; margin-top: 14px; }
  .qa h3 { margin: 0 0 6px; font-size: 16px; font-weight: 700; }
  .qa p { color: var(--muted); margin: 0; line-height: 1.6; max-width: 75ch; }

  .sec-cta { display: flex; gap: 12px; flex-wrap: wrap; }

  @media (max-width: 820px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .grid, .formats { grid-template-columns: 1fr; } }
</style>
