// Map of route id → hand-written page component. Routes NOT in this map are data-driven landing
// pages rendered by ToolLanding.svelte from routes.data.js + landing/content.ts.
import type { Component } from 'svelte';
import Home from './Home.svelte';
import Features from './Features.svelte';
import Roadmap from './Roadmap.svelte';
import SelfHosting from './SelfHosting.svelte';
import Download from './Download.svelte';
import About from './About.svelte';
import PrivacyPolicy from './PrivacyPolicy.svelte';

export const BESPOKE_PAGES: Record<string, Component> = {
  home: Home,
  features: Features,
  roadmap: Roadmap,
  'self-hosting': SelfHosting,
  download: Download,
  about: About,
  privacy: PrivacyPolicy,
};
