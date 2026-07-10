#!/usr/bin/env node
// Keeps the Tauri, Cargo and index.html JSON-LD version in lockstep with package.json.
// Runs automatically via the npm "version" lifecycle hook, e.g.:
//   npm version 1.0.2 --no-git-tag-version
// (bumps package.json, then this propagates the number to the other files).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
if (!version) throw new Error('No version found in package.json');

// tauri.conf.json — parse, set top-level "version", preserve 2-space formatting.
const tauriPath = join(root, 'src-tauri', 'tauri.conf.json');
const tauri = JSON.parse(readFileSync(tauriPath, 'utf8'));
tauri.version = version;
writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + '\n');

// Cargo.toml — replace the standalone `version = "…"` line under [package].
// The line-anchored regex avoids the inline `tauri-build = { version = "…" }`.
const cargoPath = join(root, 'src-tauri', 'Cargo.toml');
const cargo = readFileSync(cargoPath, 'utf8');
const updated = cargo.replace(/^version = "[^"]*"/m, `version = "${version}"`);
if (updated === cargo && !cargo.includes(`version = "${version}"`)) {
  throw new Error('Could not find [package] version line in Cargo.toml');
}
writeFileSync(cargoPath, updated);

// index.html — replace the "softwareVersion" in the WebApplication JSON-LD.
const htmlPath = join(root, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const htmlUpdated = html.replace(/"softwareVersion": "[^"]*"/, `"softwareVersion": "${version}"`);
if (htmlUpdated === html && !html.includes(`"softwareVersion": "${version}"`)) {
  throw new Error('Could not find "softwareVersion" in index.html');
}
writeFileSync(htmlPath, htmlUpdated);

console.log(`Synced version ${version} → tauri.conf.json, Cargo.toml, index.html`);
