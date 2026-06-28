<script lang="ts">
  import Tool from './Tool.svelte';
  const base = import.meta.env.BASE_URL;
  const EMAIL = 'hello@shad.digital';
  const REPO = 'https://github.com/therealshxd/scalir';
  const DONATE = 'https://www.paypal.com/ncp/payment/5ZZUTJ98X9E78';
  function scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }
</script>

<!-- Hero -->
<header class="hero">
  <img src={base + 'pwa-512.png'} alt="Scalir logo" />
  <h1><span class="grad">Scalir</span> — Free Bulk Image Optimisation Tool</h1>
  <p>Optimise your images for web upload for FREE. Self-host or run on your local machine.</p>
  <div class="ctas">
    <button class="cta" onclick={() => scrollTo('tool')}>Try Scalir</button>
    <button class="cta ghost" onclick={() => scrollTo('about')}>Read more</button>
  </div>

  <ol class="steps">
    <li class="step">
      <span class="step-num">1</span>
      <h3>Add your images</h3>
      <p>Drop in the files you want to compress, or choose a whole folder.</p>
    </li>
    <li class="step">
      <span class="step-num">2</span>
      <h3>Pick a preset or tweak</h3>
      <p>Start from a preset like Tiny or Web optimized, then fine-tune the settings if you need to.</p>
    </li>
    <li class="step">
      <span class="step-num">3</span>
      <h3>Optimise</h3>
      <p>Hit Optimise images — everything runs on your device, nothing is uploaded.</p>
    </li>
    <li class="step">
      <span class="step-num">4</span>
      <h3>Save your files</h3>
      <p>Download them all as a .zip, or save straight to a folder on your computer.</p>
    </li>
  </ol>
</header>

<div class="wrap">
  <!-- Section 2: the tool -->
  <section class="section">
    <h2 class="sec-title">Optimise your images</h2>
    <p class="sec-sub">Resize over 2000px · compress under 1&nbsp;MB · saved with a scaled_ prefix</p>
    <Tool />
  </section>

  <!-- Section 3: why -->
  <section class="section" id="about">
    <h2 class="sec-title">Why did you build this?</h2>
    <p class="sec-sub">I'm tired of paying for tools, so I thought I'd build my own.</p>
    <p class="sec-desc">
      I got tired of looking for tools that should be free asking me for account signups or payment
      to continue, so I built my own. I built this tool for myself and use it every day across client
      work. I use it to optimise images before uploading to WordPress sites, which reduces server
      overheads from plugins like Smush and the cost of services like Smush.
      <br /><br />
      This works locally, on your own computer. No files are stored or kept on my side — they are just
      processed by the tool. Once done, you get a zip file with your scaled images. The tool also gives
      you a good estimate of total space saved per run.
    </p>
  </section>

  <!-- Section 4: self-hosting -->
  <section class="section">
    <h2 class="sec-title">Host it yourself</h2>
    <p class="sec-sub">Bulk optimisation without the overheads</p>
    <p class="sec-desc">
      Scalir is completely free to use with no image limits. Self-hosting is available if you want to
      run it internally, behind a firewall, or as part of your own tooling — with no external dependencies.
    </p>
    <div class="sec-cta"><a class="cta" href="#/self-hosting">Deploy with Docker</a></div>
  </section>

  <!-- Section 5: local -->
  <section class="section">
    <h2 class="sec-title">Local Installation</h2>
    <p class="sec-sub">Install and run on your local machine</p>
    <p class="sec-desc">
      Prefer to run things locally? You can do this through a Docker installation on your local machine,
      or use our installer. This tool was built as a local tool first, for speed!
    </p>
    <div class="sec-cta"><a class="cta" href="#/download">Setup Locally</a></div>
  </section>

  <!-- Section 6: donate -->
  <section class="section">
    <h2 class="sec-title">Donate if you love it!</h2>
    <p class="sec-sub">I built this for free, and expect nothing in return</p>
    <p class="sec-desc">
      However, as you know, things cost money to host. I'd like to maintain this project and expand on
      it over time based on user feedback — ideally creating a suite of applications for simple tasks
      that should be free, not restricted to accounts and fees. I believe in the
      <strong>free and open-source web</strong>. If you do too, help a brother out with hosting costs.
    </p>
    <div class="sec-cta"><a class="cta" href={DONATE} target="_blank" rel="noreferrer">Donate via PayPal</a></div>
  </section>

  <!-- Section 7: bugs -->
  <section class="section">
    <h2 class="sec-title">Report bugs and issues</h2>
    <p class="sec-sub">Tell me if there's something wrong!</p>
    <p class="sec-desc">
      This tool was built with the help of Claude AI. It is not an AI tool, nor does it need to be.
      It's a simple processor for images — does what it says on the tin: compression for the web.
      If you find any bugs, please report them on the
      <a href={REPO} target="_blank" rel="noreferrer">GitHub repo</a> or drop me a message at
      <a href={'mailto:' + EMAIL}>{EMAIL}</a> and I'll review what's going wrong!
    </p>
  </section>

  <!-- Section 8: terms -->
  <section class="section">
    <h2 class="sec-title">Terms &amp; Conditions</h2>
    <p class="sec-sub">Simple. Just use the tool, and maybe mention me on Reddit.</p>
    <p class="sec-desc">
      I'm not asking for much here. Use the tool; if it's helpful, share it with friends and family,
      or post it on your social media or Reddit. I don't want to be paid for this — I just want people
      to stop thinking everything needs to be about money. It's under the
      <a href={REPO + '/blob/main/LICENSE'} target="_blank" rel="noreferrer">MIT license</a>, so whatever
      that says, just obey those rules and we're all good, homie.
    </p>
  </section>
</div>
