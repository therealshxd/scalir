<script lang="ts">
  import { onMount } from 'svelte';
  import Tool from './lib/Tool.svelte';
  const base = import.meta.env.BASE_URL;
  const HOME = 'https://scalir.org';

  // Desktop (Tauri) auto-update. Every Tauri API is dynamically imported and
  // gated behind a runtime check, so the web build never loads or runs them.
  type TauriUpdate = {
    version: string;
    downloadAndInstall: (onEvent?: (e: unknown) => void) => Promise<void>;
  };
  let update = $state<TauriUpdate | null>(null);
  let installing = $state(false);
  let failed = $state(false);

  onMount(async () => {
    if (!('__TAURI_INTERNALS__' in window)) return;
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const found = await check();
      if (found) update = found as unknown as TauriUpdate;
    } catch {
      // Offline, no published release yet, or endpoint unreachable — stay silent.
    }
  });

  async function installUpdate() {
    if (!update) return;
    installing = true;
    failed = false;
    try {
      await update.downloadAndInstall();
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (e) {
      installing = false;
      failed = true;
      console.error('Update failed', e);
    }
  }
</script>

<nav class="nav">
  <div class="nav-inner">
    <a class="brand" href={HOME} target="_blank" rel="noreferrer">
      <img src={base + 'favicon-256.png'} alt="" /> Scalir
    </a>
  </div>
</nav>

{#if update}
  <div class="wrap" style="padding-top: 14px">
    <div class="update-bar">
      <span>A new version of Scalir (v{update.version}) is available.</span>
      <div class="update-actions">
        {#if failed}<span class="update-err">Update failed — try again or download manually.</span>{/if}
        <button class="update-btn" onclick={installUpdate} disabled={installing}>
          {installing ? 'Installing…' : 'Install & restart'}
        </button>
      </div>
    </div>
  </div>
{/if}

<div class="wrap" style="padding-top: 32px">
  <Tool />
</div>

<div class="wrap">
  <footer class="site">
    <span>Scalir · private &amp; free · open source · no uploads</span>
    <span><a href={HOME} target="_blank" rel="noreferrer">scalir.org</a> · <a href={HOME + '/#/privacy'} target="_blank" rel="noreferrer">Privacy</a> · Built by Shad · MIT licensed</span>
  </footer>
</div>

<style>
  .update-bar {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    flex-wrap: wrap;
    padding: 10px 14px;
    background: var(--panel); border: 1px solid var(--line);
    border-left: 3px solid var(--accent); border-radius: 8px;
    font-size: 14px; color: var(--text);
  }
  .update-actions { display: flex; align-items: center; gap: 10px; }
  .update-err { color: var(--warn); font-size: 13px; }
  .update-btn {
    background: var(--accent); color: var(--accent-ink);
    border: 0; border-radius: 8px; padding: 8px 14px; font-weight: 600; cursor: pointer;
  }
  .update-btn:disabled { opacity: .6; cursor: default; }
</style>
