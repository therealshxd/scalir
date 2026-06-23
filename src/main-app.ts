import { mount } from 'svelte';
import AppStandalone from './AppStandalone.svelte';
import './app.css';

const app = mount(AppStandalone, { target: document.getElementById('app')! });
export default app;
