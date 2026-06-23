<script lang="ts">
  const REPO = 'https://github.com/therealshxd/scalir';
</script>

<div class="wrap doc">
  <section class="section" style="border-top:0">
    <h1>Self-hosting Scalir</h1>
    <p class="lead">
      Run your own instance of Scalir — no limits, no external dependencies, no data leaving your
      network. Pick the deployment method that suits your setup.
    </p>

    <!-- Option A: Docker Compose -->
    <div class="card">
      <h3>Option A — Docker Compose <span class="badge new">Recommended</span></h3>
      <p>
        Clone the repo and bring it up with Docker Compose. Nginx serves the built static app on
        port&nbsp;8080 — point your reverse proxy at that.
      </p>
      <pre><code># 1. Clone
git clone {REPO}
cd scalir

# 2. Start (builds the image on first run, ~60 s)
docker compose up -d

# App is now running at http://localhost:8080</code></pre>
      <p style="margin-top:12px">
        To update to a newer version, pull the latest code and rebuild:
      </p>
      <pre><code>git pull
docker compose up -d --build</code></pre>
      <p style="margin-top:12px">
        To run on a different port, edit <code>docker-compose.yml</code> and change
        <code>"8080:80"</code> to your preferred port before starting.
      </p>
      <a class="cta ghost" style="margin-top:4px" href={REPO} target="_blank" rel="noreferrer">View on GitHub</a>
    </div>

    <!-- Option B: Dokploy / Coolify -->
    <div class="card">
      <h3>Option B — Dokploy, Coolify &amp; similar panels</h3>
      <p>
        If you manage your server with a Docker-based deployment panel, Scalir works out of the box
        since it ships a <code>Dockerfile</code>. The steps below are for
        <a href="https://dokploy.com" target="_blank" rel="noreferrer">Dokploy</a> but are nearly
        identical for <a href="https://coolify.io" target="_blank" rel="noreferrer">Coolify</a>,
        Caprover, and others — just look for "new app from Git".
      </p>

      <p><strong>Steps (Dokploy)</strong></p>
      <ol>
        <li>Fork the <a href={REPO} target="_blank" rel="noreferrer">Scalir repo</a> to your own GitHub account.</li>
        <li>In your Dokploy dashboard → <strong>Create Project</strong> → <strong>Application</strong>.</li>
        <li>Connect your GitHub account and select your forked repo.</li>
        <li>Set <strong>Build type</strong> to <em>Dockerfile</em> — Dokploy will find it automatically.</li>
        <li>Set <strong>Container port</strong> to <code>80</code>.</li>
        <li>Add a domain under the <strong>Domains</strong> tab and enable HTTPS.</li>
        <li>Hit <strong>Deploy</strong>. Dokploy builds the image and starts the container.</li>
      </ol>

      <p style="margin-top:4px">
        <strong>Updating:</strong> push a commit to your fork (or merge upstream changes), then
        trigger a redeploy from the Dokploy dashboard — or enable auto-deploy on push.
      </p>

      <p style="margin-top:4px">
        <strong>Coolify:</strong> same flow — New Resource → Public Repository → paste the repo URL
        → Build Pack: <em>Dockerfile</em> → set port to <code>80</code> → Deploy.
      </p>
    </div>

    <!-- Option C: Manual build -->
    <div class="card">
      <h3>Option C — Manual build</h3>
      <p>
        Build the static files yourself and serve them from any host — nginx, Caddy, Apache,
        Netlify, Cloudflare Pages, etc.
      </p>
      <p style="margin-top:0"><strong>Requirements:</strong> Node.js 20+</p>
      <pre><code># 1. Clone and install
git clone {REPO}
cd scalir
npm install

# 2. Build the standalone app
npm run build:app
# Output: dist-app/

# 3. Serve with any static server, e.g.:
npx serve dist-app</code></pre>
      <p style="margin-top:12px">
        Copy <code>dist-app/</code> to your web server's document root. No server-side logic needed
        — it's a fully static site.
      </p>
      <p>
        <strong>nginx example</strong> — minimal config to serve from <code>/opt/scalir</code>:
      </p>
      <pre><code>server &#123;
    listen 80;
    root /opt/scalir;
    index index.html;
    location / &#123;
        try_files $uri $uri/ /index.html;
    &#125;
&#125;</code></pre>
    </div>

    <p class="lead" style="margin-top:24px">
      If Scalir is useful to you, a short mention anywhere you like is all I ask.
      <a href="#/">← Back to the tool</a>
    </p>
  </section>
</div>

<style>
  .badge.new { color: var(--ok); background: rgba(56,193,114,.14); border-color: #1e5c38; }
  ol { color: var(--muted); padding-left: 20px; margin: 8px 0 14px; }
  ol li { margin-bottom: 6px; }
  ol a { color: var(--accent); }
</style>
