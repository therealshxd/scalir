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

    <div class="note">
      <strong>Two Dockerfiles:</strong> <code>Dockerfile</code> builds the <strong>tool only</strong>
      (what most self-hosters want), and <code>Dockerfile.landing</code> builds the
      <strong>full site</strong> (this landing page + the tool). When a deployment panel asks for a
      Dockerfile path, pick the one you want.
    </div>

    <!-- Option A: Docker Compose -->
    <div class="card">
      <h3>Option A — Docker Compose <span class="badge new">Recommended</span></h3>
      <p>
        Clone the repo and bring up the <code>scalir</code> service (the tool). Nginx serves it on
        port&nbsp;8080 — point your reverse proxy at that.
      </p>
      <pre><code># 1. Clone
git clone {REPO}
cd scalir

# 2. Start the tool (builds the image on first run, ~60 s)
docker compose up -d scalir

# Tool is now running at http://localhost:8080</code></pre>
      <p style="margin-top:12px">
        The compose file also defines a <code>scalir-landing</code> service (port&nbsp;8081) that
        serves the full site. Run <code>docker compose up -d scalir-landing</code> for that, or omit
        the service name to start both.
      </p>
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
        <li>In your Dokploy dashboard → <strong>Create Project</strong> → <strong>Create Service → Application</strong> (not Compose).</li>
        <li>Under <strong>Provider</strong>, connect GitHub and select the repo (or paste the public repo URL), branch <code>main</code>.</li>
        <li>
          Set <strong>Build Type</strong> to <em>Dockerfile</em>. Note this is a
          <strong>separate card below the Git source section</strong> — not inside the GitHub tab.
          Then set the <strong>Docker File</strong> path to <code>Dockerfile</code> for the tool
          (use <code>Dockerfile.landing</code> for the full site).
        </li>
        <li>Set <strong>Container port</strong> to <code>80</code>.</li>
        <li>Add a domain under the <strong>Domains</strong> tab and enable HTTPS.</li>
        <li>Hit <strong>Deploy</strong>. Dokploy builds the image and starts the container.</li>
      </ol>

      <p style="margin-top:4px">
        <strong>Updating manually:</strong> after new commits land on <code>main</code>, hit
        <strong>Redeploy</strong> in the dashboard — Dokploy pulls the latest commit and rebuilds
        the image. Note that tracking is by <strong>branch</strong>, not git tags.
      </p>

      <p><strong>Auto-deploy on push (optional)</strong></p>
      <p>
        To rebuild automatically on every push to <code>main</code>, set up a webhook one of two ways:
      </p>
      <ol>
        <li>
          <strong>GitHub App (cleanest):</strong> Dokploy → <strong>Settings → Git → GitHub</strong> →
          install the GitHub App and grant it access to your repo. Then open the app →
          <strong>Provider</strong>, confirm branch <code>main</code>, and toggle
          <strong>Auto Deploy → On</strong>. Dokploy creates and manages the webhook for you —
          nothing to do on the GitHub side.
        </li>
        <li>
          <strong>Manual webhook:</strong> on the app, toggle <strong>Auto Deploy → On</strong> and copy
          the <strong>Webhook URL</strong> it shows. In GitHub → repo
          <strong>Settings → Webhooks → Add webhook</strong>, paste it as the Payload URL, set
          Content type to <code>application/json</code>, choose <em>Just the push event</em>, and save.
        </li>
      </ol>
      <p>
        Verify with a test push: the GitHub webhook's <strong>Recent Deliveries</strong> should show a
        <code>200</code>, and a new build should appear under the app's <strong>Deployments</strong> tab.
      </p>
      <p style="margin-top:4px">
        <strong>After any deploy:</strong> hard-refresh the site (Ctrl/Cmd-Shift-R). Scalir is a PWA,
        so the service worker can serve cached assets until it updates.
      </p>

      <p style="margin-top:4px">
        <strong>Coolify:</strong> same flow — New Resource → Public Repository → paste the repo URL
        → Build Pack: <em>Dockerfile</em> → Dockerfile location <code>Dockerfile</code> (or
        <code>Dockerfile.landing</code>) → set port to <code>80</code> → Deploy.
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
  .note { background: var(--panel); border: 1px solid var(--line); border-left: 3px solid var(--accent);
    border-radius: 8px; padding: 12px 14px; margin: 0 0 22px; font-size: 14px; color: var(--text); }
  .note code { color: var(--accent); }
</style>
