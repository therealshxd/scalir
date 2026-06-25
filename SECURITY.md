# Security Policy

## Supported versions

Scalir is actively developed on the `main` branch. Security fixes are applied to the
**latest release** and the current `main`. Older tagged releases are not maintained —
please update to the latest version before reporting an issue.

| Version | Supported |
|---|---|
| Latest release / `main` | ✅ |
| Older releases | ❌ |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report privately using GitHub's built-in private vulnerability reporting:

1. Go to the [Security tab](https://github.com/therealshxd/scalir/security) of the repo.
2. Click **"Report a vulnerability"** and fill in the advisory form.

If you can't use that for any reason, email **hello@shad.digital** instead.

Please include:

- A description of the issue and its potential impact.
- Steps to reproduce (a proof of concept if you have one).
- Affected version / commit, and whether it's the hosted site or a self-host build.

You can expect an acknowledgement within a few days. As a solo-maintained project,
timelines are best-effort, but valid reports will be taken seriously and credited (if
you'd like) once a fix ships.

## Scope and threat model

Scalir is intentionally a **small attack surface**:

- All image processing happens **in the browser, on the user's device**. There are
  **no uploads, no server-side processing, no accounts, and no telemetry** — images
  never leave the machine.
- The codebase is static frontend assets (Svelte/Vite) plus WebAssembly codecs
  ([jSquash](https://github.com/jamsinclair/jSquash)).

The most relevant areas for security reports are therefore:

- Client-side issues such as XSS or unsafe handling of file input/metadata.
- Vulnerabilities in bundled dependencies.
- **For self-hosters:** the Docker image serves the built site via nginx. Keep your
  base images and host patched — that container is yours to maintain.

Thanks for helping keep Scalir and its users safe.
