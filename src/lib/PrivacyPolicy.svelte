<script lang="ts">
  const EMAIL = 'hello@shad.digital';
  const REPO = 'https://github.com/therealshxd/scalir';
</script>

<div class="wrap doc">
  <section class="section" style="border-top:0">
    <h1>Privacy Policy</h1>
    <p class="lead">
      Short version: your images never leave your device, and the little bit of usage data we
      collect is anonymous and cookieless.
    </p>

    <!-- Images -->
    <div class="card">
      <h3>Your images never leave your device</h3>
      <p class="muted-sub">Everything happens in your browser.</p>
      <p>
        Scalir compresses, resizes and converts your images entirely on your own computer. Your
        files are <strong>never uploaded</strong> to a server, never stored by us, and never seen
        by anyone but you. When a run finishes you get a ZIP back — that's the whole story.
      </p>
    </div>

    <!-- Analytics -->
    <div class="card">
      <h3>Analytics we use</h3>
      <p class="muted-sub">Self-hosted, cookieless, no personal data.</p>
      <p>
        To understand how the site is used, we run our own instance of
        <a href="https://umami.is" target="_blank" rel="noreferrer">Umami</a> at
        <strong>analytics.scalir.org</strong>. It's a privacy-first analytics tool: it uses
        <strong>no cookies</strong>, collects <strong>no personal data</strong>, and does
        <strong>no cross-site tracking</strong>. It also <strong>honours your browser's
        “Do Not Track” setting</strong> — if that's on, you're not counted at all.
      </p>
      <p>
        Analytics only runs on the public website (scalir.org and its preview host). The
        <strong>desktop app and self-hosted copies collect nothing whatsoever</strong>.
      </p>
    </div>

    <!-- What we collect -->
    <div class="card">
      <h3>What we collect</h3>
      <p class="muted-sub">Aggregate, anonymous usage — nothing that identifies you.</p>
      <p>
        In aggregate, Umami records: which pages are viewed, the referring site, an approximate
        country (worked out from your IP address, which is <strong>not stored</strong>), and your
        browser, operating system and device type. On top of that we log a few anonymous events so
        we can improve the tool: how far down a page people scroll, when the
        <strong>Optimise</strong> button is clicked, and the <strong>number</strong> of images
        added in a batch.
      </p>
    </div>

    <!-- What we never collect -->
    <div class="card">
      <h3>What we never collect</h3>
      <p class="muted-sub">The important part.</p>
      <p>
        We never collect your images or their filenames — only a plain count of how many were
        added. There are no accounts, no cookies and no advertising trackers, and we never sell or
        share any data with third parties.
      </p>
    </div>

    <!-- Contact -->
    <div class="card">
      <h3>Questions?</h3>
      <p class="muted-sub">Happy to help.</p>
      <p>
        Ask away at <a href={'mailto:' + EMAIL}>{EMAIL}</a> or open an issue on the
        <a href={REPO} target="_blank" rel="noreferrer">GitHub repo</a>. Scalir is open source, so
        you can read exactly what it does for yourself.
      </p>
    </div>

    <p class="lead" style="margin-top:18px"><a href="/">← Back to the tool</a></p>
  </section>
</div>

<style>
  .card p { color: var(--muted); margin: 0 0 12px; line-height: 1.6; }
  .card p:last-of-type { margin-bottom: 0; }
  .card p strong { color: var(--text); }
  .muted-sub { color: var(--accent) !important; font-weight: 600; margin-bottom: 10px !important; }
  .card p a { color: var(--accent); }
</style>
