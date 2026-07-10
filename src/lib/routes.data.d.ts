// Hand-written declarations for routes.data.js (kept in sync with its @typedef). The registry
// stays a plain .js module so scripts/prerender.mjs can import it without a TS toolchain.

export type RouteGroup = 'product' | 'convert' | 'compress' | 'resize' | 'compare' | 'legal';

export interface RouteEntry {
  id: string;
  path: string;
  title: string;
  description: string;
  crumb: string;
  group: RouteGroup;
  kind: 'bespoke' | 'landing';
  tier?: 1 | 2 | 3;
  llms?: string;
}

export declare const ROUTE_LIST: readonly RouteEntry[];
export declare const byId: Record<string, RouteEntry>;
export declare const byPath: Record<string, string>;
