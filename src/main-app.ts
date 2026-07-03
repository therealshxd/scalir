import { mount } from 'svelte';
import AppStandalone from './AppStandalone.svelte';
import { initAnalytics } from './lib/analytics';
import './app.css';

initAnalytics();
const app = mount(AppStandalone, { target: document.getElementById('app')! });
export default app;
