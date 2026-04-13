# Tome of Knowledge

Next.js app running in Docker Compose. A diegetic "Scholar's Archive" reading experience.

## Stack

- **Next.js** 15.5.15 (App Router, RSC)
- **React** 19
- **TypeScript** 5 (strict)
- **Node** 20 (alpine) in Docker
- **Tailwind CSS** 3.4 with `@tailwindcss/forms` and `@tailwindcss/container-queries`
- **Newsreader** serif via `next/font/google` (CSS variable `--font-newsreader`)
- **Material Symbols Outlined** via Google Fonts `<link>` in [app/layout.tsx](app/layout.tsx)

## Layout

- [app/layout.tsx](app/layout.tsx) — root layout, loads Newsreader + Material Symbols, sets `html.dark`
- [app/globals.css](app/globals.css) — `@tailwind` directives + page utilities (`leader-dots`, `drop-cap`, `drop-cap-sm`, `parchment-texture`, `parchment-glow`, `parchment-mask`, `no-scrollbar`, radial-dot body background)
- [tailwind.config.ts](tailwind.config.ts) — Scholar's Archive design tokens as Tailwind theme extensions (colors, roundness, fontFamily)
- [postcss.config.js](postcss.config.js) — PostCSS pipeline for Tailwind + Autoprefixer

### Routes

- `/` — [app/page.tsx](app/page.tsx) — Landing ("The Grand Library of Oakhaven" hero, Lexicon bento grid, stats footer)
- `/contents` — [app/contents/page.tsx](app/contents/page.tsx) — Table of Contents with leader-dot ledger rows
- `/entry` — [app/entry/page.tsx](app/entry/page.tsx) — Manuscript detail with drop-cap article and marginalia sidebar
- `/scribe` — [app/scribe/page.tsx](app/scribe/page.tsx) — Editable Scribe Desk with floating toolbar

### Shared components — [app/components/](app/components/)

All pages consume the same app shell so chrome, brand, colors, and typography stay uniform.

- [`AppShell`](app/components/AppShell.tsx) — wraps pages with `SideNavBar` + `TopAppBar` + main + decorative corner. Page content is passed as `children`.
- [`SideNavBar`](app/components/SideNavBar.tsx) — w-72 sticky sidebar. Takes an `active: NavKey` prop (`"library" | "contents" | "scribe" | "archived"`). Items are defined in one place.
- [`TopAppBar`](app/components/TopAppBar.tsx) — sticky top bar with "Tome of Knowledge" brand, search field, account glyph.
- [`Button`](app/components/Button.tsx) — `primary` / `secondary` / `ghost` variants, `sm` / `md` sizes, optional `icon`. Use this instead of inline `<button className="...">`.
- [`SectionHeading`](app/components/SectionHeading.tsx) — `<h2>` with gradient rule and optional actions slot.
- [`app/components/index.ts`](app/components/index.ts) — barrel export: `import { AppShell, Button, ... } from "./components"`.

## UI Design System

- **Source of truth** — [`references/design-system/design-system.md`](references/design-system/design-system.md) and [`references/design-system/tokens.json`](references/design-system/tokens.json) are **canonical** and governed. Never modify them without an explicit user decision. The runtime (Tailwind config, globals, components) must conform to these files, not the other way around. If the runtime disagrees with the docs, the runtime is wrong.
- **Change protocol** — when a design change is needed: (1) discuss and decide with the user, (2) update `design-system.md` + `tokens.json` first, (3) propagate to [`tailwind.config.ts`](tailwind.config.ts), [`app/globals.css`](app/globals.css), and shared components, (4) verify the pages visually.
- **Stitch is ideation only** — Stitch is used as a wireframing / ideation tool for initial iterations. Its output is not canonical. Generated HTML snapshots live in [`references/stitch-html/`](references/stitch-html/) for reference but do not override the design system.
- **Pages must use `AppShell` and shared components** — do not reintroduce bespoke sidebars, brand wordmarks, or hardcoded `amber-*` / `stone-*` / hex colors in page code. Always use the semantic tokens (`bg-surface`, `text-primary`, `border-outline-variant`, etc.) so the theme stays swappable.

## Dev workflow

The compose file bind-mounts the project into `/app` with anonymous volumes shielding `node_modules` and `.next`, so host edits hot-reload inside the container (`WATCHPACK_POLLING=true` for Windows file-watch reliability).

```bash
docker compose up --build -d      # build + start
docker compose logs -f web        # tail logs
docker compose down               # stop
docker compose down -v            # stop + destroy node_modules volume (needed after package.json changes)
```

App served at http://localhost:3000.

## Notes

- Source edits hot-reload; no rebuild needed.
- Rebuild (`--build`) is only needed when `package.json` changes, **and** you must `docker compose down -v` first so the anonymous `node_modules` volume gets repopulated with the new image's `node_modules`.
- `.next` and `node_modules` live in anonymous volumes — don't expect them on the host.
