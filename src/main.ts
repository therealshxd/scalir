import { mount } from 'svelte';
import App from './App.svelte';
import { initAnalytics } from './lib/analytics';
import './app.css';

initAnalytics();
// Each route is prerendered to static HTML (scripts/prerender.mjs) for crawlers; discard that
// markup before the client-side mount so Svelte doesn't render a second copy alongside it.
const target = document.getElementById('app')!;
target.replaceChildren();
const app = mount(App, { target });
export default app;
