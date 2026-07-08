<script lang="ts">
  const REPO = 'https://github.com/therealshxd/scalir';

  const installers = [
    { os: 'Windows', meta: '.msi / .exe · Windows 10/11', url: REPO + '/releases/latest', cta: 'Download' },
    { os: 'Linux', meta: '.AppImage · .deb · .rpm', url: REPO + '/releases/latest', cta: 'Download' },
  ];
</script>

<div class="wrap doc">
  <section class="section" style="border-top:0">
    <h1>Local Installation</h1>
    <p class="lead">
      Run Scalir on your own machine — no internet required after setup, no data leaves your device.
      Native builds for Windows and Linux are available now, and Docker works on any platform. On
      macOS? The <a href="/">free web version</a> runs the full tool right in your browser.
    </p>

    <!-- Native installers -->
    <div class="dl-grid">
      {#each installers as i}
        <div class="dl">
          <div class="os">{i.os}</div>
          <div class="meta">{i.meta}</div>
          {#if i.url}
            <a class="cta" data-track="download-app" data-track-value={i.os.toLowerCase()} href={i.url} target="_blank" rel="noreferrer">{i.cta}</a>
          {:else}
            <button class="cta disabled" disabled>{i.cta}</button>
          {/if}
        </div>
      {/each}
    </div>

    <p class="meta-note">
      On first launch, Windows may show a SmartScreen “unknown publisher” prompt because the installer
      isn't code-signed yet. Click <strong>More info → Run anyway</strong> to continue — the app is
      open source and runs entirely offline.
    </p>

    <!-- Docker local run -->
    <div class="card" style="margin-top:24px">
      <h2>Run locally with Docker <span class="badge new">Available now</span></h2>
      <p>
        The quickest way to run Scalir on your machine today. You'll need
        <a href="https://docs.docker.com/get-docker/" target="_blank" rel="noreferrer">Docker Desktop</a>
        installed (Windows, macOS, or Linux).
      </p>

      <p><strong>Option 1 — Clone and run with Docker Compose</strong></p>
      <pre><code># Clone the repo
git clone {REPO}
cd scalir

# Build and start (first run takes ~60 s)
docker compose up -d

# Open in your browser:
# http://localhost:8080</code></pre>

      <p style="margin-top:12px"><strong>Option 2 — Single docker run command</strong></p>
      <p style="margin-top:0">
        If you don't want to clone the repo, build the image from the remote Dockerfile directly:
      </p>
      <pre><code># Build the image
docker build {REPO}#main -t scalir

# Run it
docker run -d -p 8080:80 --name scalir scalir

# Open in your browser:
# http://localhost:8080</code></pre>

      <p style="margin-top:12px"><strong>Stopping and starting</strong></p>
      <pre><code># Stop
docker compose stop        # if using Compose
docker stop scalir         # if using docker run

# Start again
docker compose start
docker start scalir

# Remove completely
docker compose down
docker rm -f scalir && docker rmi scalir</code></pre>
    </div>

    <p class="lead" style="margin-top:24px"><a href="/">← Back to the tool</a></p>
  </section>
</div>

<style>
  .badge.new { color: var(--ok); background: rgba(56,193,114,.14); border-color: #1e5c38; }
  .meta-note { color: var(--muted); font-size: 13px; margin-top: 14px; max-width: 70ch; }
  /* Two installers now (Windows + Linux) — keep tiles balanced instead of a 3-col grid with a gap. */
  .dl-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
</style>
