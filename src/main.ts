import { mount } from 'svelte';
import App from './App.svelte';
import { initAnalytics } from './lib/analytics';
import './app.css';

initAnalytics();
const app = mount(App, { target: document.getElementById('app')! });
export default app;
