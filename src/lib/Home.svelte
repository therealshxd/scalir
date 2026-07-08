<script lang="ts">
  import Tool from './Tool.svelte';
  import Faq from './Faq.svelte';
  import { HOME_FAQ } from './seo';
  const base = import.meta.env.BASE_URL;
  function scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }
</script>

<!-- Hero -->
<header class="hero">
  <img src={base + 'pwa-192.png'} alt="Scalir" width="76" height="76" fetchpriority="high" />
  <h1><span class="grad">Free Bulk Image Compressor</span> — Scalir</h1>
  <p>
    Scalir is a free <strong>bulk image compressor</strong> and <strong>image optimiser</strong> —
    compress images online, resize and convert in bulk without uploading a thing. JPG, PNG, WebP,
    AVIF and more, no sign-up and completely private. It's a free image optimizer that runs entirely
    in your browser, so every image is processed on your own device.
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

  <!-- Why private / in-browser (engagement + trust) -->
  <section class="section">
    <h2 class="sec-title">Why Scalir is a private, in-browser image compressor</h2>
    <p class="sec-sub">Compress images in your browser — nothing uploaded, nothing to install</p>

    <figure class="ba">
      <!-- svelte-ignore a11y_img_redundant_alt -->
      <!-- alt intentionally contains the product term "image compression" (SEO + descriptive) -->
      <img src={base + 'img/bulk-image-compression-before-after.webp'}
        alt="Before and after bulk image compression showing a smaller file size at the same quality"
        width="1200" height="600" loading="lazy" decoding="async" />
      <figcaption>Same photo, a fraction of the size — compressed on your own device, nothing uploaded.</figcaption>
    </figure>

    <div class="why">
      <div class="why-copy">
        <p>
          Most image tools upload your files to a server to process them. Scalir doesn't. It's a
          <strong>private image compressor</strong> that runs entirely in your browser — an image
          compressor with no upload step at all. You compress images in your browser, and your
          originals never leave your device.
        </p>
        <p>
          That local-first approach is also fast: with no upload or download round-trip, you can
          reduce image file size and shrink image size online the instant you drop files in — and it
          keeps working offline once loaded.
        </p>
      </div>
      <!-- svelte-ignore a11y_img_redundant_alt -->
      <img class="why-img" src={base + 'img/private-in-browser-image-optimiser.webp'}
        alt="Images being optimised privately in a web browser with nothing uploaded to a server"
        width="1000" height="720" loading="lazy" decoding="async" />
    </div>
  </section>

  <!-- Benefits / why Scalir -->
  <section class="section">
    <h2 class="sec-title">A free image optimiser that respects your privacy</h2>
    <p class="sec-sub">An online image optimiser for bulk compression, resizing and conversion — 100% in your browser</p>
    <div class="grid">
      <div class="card">
        <h3>Bulk image compression</h3>
        <p>Compress hundreds of images at once. Scalir uses all your CPU cores in parallel, so large batches finish fast — with no per-image limits when you self-host.</p>
      </div>
      <div class="card">
        <h3>Smart resizing</h3>
        <p>Cap the longest side with high-quality Lanczos3 resampling, or <a href="/features">resize images online</a> by exact width, height or percentage. Aspect ratio is always kept and images are never cropped or upscaled.</p>
      </div>
      <div class="card">
        <h3>Modern formats — WebP &amp; AVIF</h3>
        <p>Convert JPG and PNG to WebP or AVIF for the smallest possible web-ready files, or keep your original format. Bring in iPhone photos too and <a href="/features">convert HEIC to JPG</a> or WebP — mix any inputs in one batch.</p>
      </div>
      <div class="card">
        <h3>Private — nothing uploaded</h3>
        <p>Every image is decoded, resized and compressed on your own device. Nothing is ever uploaded, and EXIF/GPS metadata is stripped on export.</p>
      </div>
      <div class="card">
        <h3>Free &amp; open source</h3>
        <p>No accounts, no watermarks, no paywall. Scalir is MIT-licensed and you can <a href="/self-hosting">self-host it with Docker</a> for unlimited use behind your firewall.</p>
      </div>
      <div class="card">
        <h3>Works offline</h3>
        <p>Install Scalir as a PWA or run the <a href="/download">desktop image compressor</a> for Windows and Linux. Once loaded it works fully offline — fast image compression with no browser tab required.</p>
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
    <Faq items={HOME_FAQ} open />
    <div class="sec-cta" style="margin-top:22px">
      <button class="cta" data-track="cta" data-track-value="home-faq-compress" onclick={() => scrollTo('tool')}>Compress images now</button>
      <a class="cta ghost" href="/features">Explore all features</a>
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

  /* before/after proof image + privacy-section media */
  .ba { margin: 4px 0 22px; }
  .ba img { width: 100%; height: auto; display: block; border: 1px solid var(--line); border-radius: 14px; }
  .ba figcaption { color: var(--muted); font-size: 13px; margin-top: 8px; text-align: center; }
  .why { display: grid; grid-template-columns: 1.15fr 1fr; gap: 22px; align-items: center; }
  .why-copy p { color: var(--text); opacity: .95; line-height: 1.6; margin: 0 0 14px; max-width: 60ch; }
  .why-copy p:last-child { margin-bottom: 0; }
  .why-img { width: 100%; height: auto; display: block; border: 1px solid var(--line); border-radius: 14px; }

  .sec-cta { display: flex; gap: 12px; flex-wrap: wrap; }

  @media (max-width: 820px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .grid, .formats, .why { grid-template-columns: 1fr; } }
</style>
