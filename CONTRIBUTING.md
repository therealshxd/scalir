# Contributing to Scalir

Thanks for taking the time to help out! Scalir is a free, privacy-first image
optimiser built on the belief that simple, useful tools shouldn't be locked behind
accounts and paywalls. Contributions that keep it fast, private, and easy to use are
very welcome.

A quick heads-up: this is a small, **solo-maintained** project. Reviews may not be
instant — please be patient, and for anything non-trivial, **open an issue first** so
we can agree on the approach before you invest time in a PR.

By participating you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug** — use the Bug report form under [Issues → New issue](https://github.com/therealshxd/scalir/issues/new/choose).
- **Suggest a feature** — use the Feature request form. Tell us the problem you're
  trying to solve, not just the solution.
- **Send a pull request** — fixes, docs, tests, or features discussed in an issue.
- **Report a security issue** — please **don't** open a public issue; see
  [SECURITY.md](./SECURITY.md).

## Development setup

```bash
npm install
npm run dev        # http://localhost:5173
```

There are two build targets — keep both in mind when changing UI or routing:

```bash
npm run build      # full landing site  → dist/
npm run build:app  # tool only (no marketing pages) → dist-app/
```

## Before you open a PR

Please make sure both of these pass:

```bash
npm test           # vitest engine suite (runs in Node, no browser needed)
npm run check      # svelte-check / TypeScript
```

> **Known quirk:** `npm run check` reports one pre-existing error in `vitest.config.ts`
> (`Module '"vitest/config"' has no exported member 'defineConfig'`). It is unrelated to
> your change and safe to ignore — the tests still pass. Don't "fix" it as part of an
> unrelated PR.

If your change touches the UI, also do a quick manual pass in `npm run dev` (drag in a
few images, optimise, download) and include a screenshot or short clip in the PR.

## Architecture notes

The image engine lives in [`src/core/`](./src/core) and is deliberately **framework-free**.
It talks to the outside world only through the `Codecs` interface, which is why it can be
unit-tested in Node with mock codecs.

- `optimise.ts` — the rules (resize → compress → name), orchestrated.
- `rules.ts` — format detection, resize math, quality search.
- `codecs.ts` — jSquash (WASM) bindings for the browser.
- `exif.ts` / `naming.ts` — orientation handling and output filenames.

When you change engine behaviour, **add or update tests in
[`test/core.test.ts`](./test/core.test.ts)** using the existing `MockCodecs` pattern.
Keep the engine free of Svelte/DOM imports.

## Pull request guidelines

- Keep PRs **small and focused** — one logical change per PR.
- **Link the issue** the PR addresses.
- Describe the **user-visible impact** (what changes for someone using the tool).
- Match the existing commit style — short, imperative subject lines (e.g.
  `Add AVIF output option`, `Fix EXIF orientation on portrait JPEGs`).
- Don't add network calls, telemetry, or uploads. Scalir is **100% client-side** and
  must stay that way.
- Avoid pulling in heavy new dependencies without discussing it first.

Not sure about something? Open an issue or email **hello@shad.digital**. Thanks again!
