# Tome of Knowledge

Next.js app running in Docker Compose. A diegetic "Scholar's Archive" reading experience.

## Workflow

- **Test-driven development** — all work planning must follow TDD. Every phase plan includes a test strategy (frameworks, unit/integration/E2E scope, what to cover). Write failing tests before implementation, then make them pass. No phase ships without tests for its core logic.
- **Regression safety** — new tests get added to the suite permanently; never delete a passing test to make a change easier. If behavior legitimately changes, update the test in the same commit as the code.
- **Linting** — ESLint (`next lint` via `eslint-config-next`) + TypeScript strict checks must pass before any commit. The `lint` npm script is authoritative; if it fails, the work isn't done. Rules are not disabled ad-hoc — if a rule is wrong for this codebase, disable it in config with a comment explaining why. Every phase plan treats lint + typecheck as part of the "done" definition alongside tests.
- **Test execution env** — tests run on the **host**, not inside the Docker container (vitest is fast, Docker adds latency). Fixture paths must be portable; never hardcode container paths. Playwright E2E runs against `docker compose up` locally and against a spun-up container in CI.
- **UI design review gate** — any phase that adds or changes UI surface must invoke the `ui-design-system-guardian` agent in **review mode** before the phase is marked done. The agent checks component output against [`references/design-system/`](references/design-system/). Findings block merge until resolved (either by fixing the code or — rarely, with explicit user decision — updating the design system files first per the protocol in the UI Design System section below). This is a process rule enforced by the assistant, not an npm script.

## Agent workspace

- **`.agent/`** (gitignored) — Claude's local scratchpad. Check here first on new sessions for handoff notes. See [`.agent/README.md`](.agent/README.md) for conventions. Subfolders: `handoff/`, `scratch/`, `plans/`, `decisions/`.
- **Persistent cross-session memory** lives at `C:\Users\gotsa\.claude\projects\C--Users-gotsa-source-repos-tome-of-knowledge\memory\` — indexed by `MEMORY.md`. Long-lived facts about the user/project go there; in-flight work-state goes in `.agent/`.
- **Committed plans** live in [`docs/plans/`](docs/plans/). Drafts-in-progress live in `.agent/plans/` until they're ready to promote.

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
- **Stitch is ideation only** — Stitch is used as a wireframing / ideation tool for initial iterations. Its output is not canonical and does not override the design system.
- **Pages must use `AppShell` and shared components** — do not reintroduce bespoke sidebars, brand wordmarks, or hardcoded `amber-*` / `stone-*` / hex colors in page code. Always use the semantic tokens (`bg-surface`, `text-primary`, `border-outline-variant`, etc.) so the theme stays swappable.

## Auth

- **Stack** — Auth.js v5 (`next-auth@beta`) with Credentials provider, Drizzle ORM, SQLite via `@libsql/client` (file URL). JWT session strategy with `role` embedded in the token (Credentials provider requires JWT; DB sessions table exists but is reserved for future OAuth providers).
- **Roles** — `user` and `gm` (game master). GM can mint invite URLs and (later phase) view drafts/gm-only content. Helpers: [`lib/auth-helpers.ts`](lib/auth-helpers.ts) exposes `getSessionUser()` and `requireGm()`.
- **Bootstrap** — first boot runs [`instrumentation.ts`](instrumentation.ts) → applies migrations in [`lib/db/migrations/`](lib/db/migrations/) → seeds a GM user from `GM_USERNAME` / `GM_EMAIL` / `GM_PASSWORD` / `GM_DISPLAY_NAME` env vars if none exists. Idempotent.
- **Invite flow** — invite-only signup. GM clicks account glyph → "Create invite" → the browser copies a `/invite/<token>` URL to the clipboard. Recipient visits the URL, fills in username/email/display name/password, account is created with the invite's role, invite is marked used. Tokens are single-use with a 7-day TTL.
- **Env vars** — see [`.env.example`](.env.example). Required: `AUTH_SECRET` (generate with `openssl rand -base64 32`), `DATABASE_URL` (defaults to `file:/app/data/tome.db` in Docker), `GM_*` seed vars.
- **Data volume** — SQLite file lives in the `tome-data` named volume mounted at `/app/data`. Survives `docker compose down`, destroyed by `docker compose down -v`.
- **Drizzle scripts** — `npm run db:generate` (create migration from schema diff), `npm run db:migrate` (apply migrations — normally done by instrumentation), `npm run db:studio` (browse the DB).
- **No route gating yet** — this phase is plumbing only. All existing routes (`/`, `/contents`, `/entry`, `/scribe`) remain public. Login works end-to-end, but no `middleware.ts` redirects are in place. Content model + gating land in a later phase.

## Dev workflow

The compose file bind-mounts the project into `/app` with anonymous volumes shielding `node_modules` and `.next`, so host edits hot-reload inside the container (`WATCHPACK_POLLING=true` for Windows file-watch reliability).

```bash
docker compose up --build -d      # build + start
docker compose logs -f web        # tail logs
docker compose down               # stop
docker compose down -v            # stop + destroy node_modules volume (needed after package.json changes)
```

App served at http://localhost:3000.

## Feedback loop

- Logged-in users see a small `bug_report` trigger in the lower-right corner. Clicking it captures a screenshot of the current viewport (via `html2canvas`, downscaled to 1600px wide, JPEG q=0.85), opens a modal for a category + description, and `POST`s to `/api/feedback`.
- The server route ([app/api/feedback/route.ts](app/api/feedback/route.ts)) files a GitHub issue on `GITHUB_REPO` using `GITHUB_TOKEN`. The screenshot is committed to the orphan branch `feedback-screenshots` (path: `screenshots/<YYYY-MM-DD>/<uuid>.jpg`) and referenced in the issue body as a raw-content URL.
- Issues land with labels `user-feedback` + `feedback/<category>` and a title `[Feedback][<Category>] <summary>`. Agents should subscribe to the `user-feedback` label to triage.
- Leave `GITHUB_TOKEN` empty to disable locally — the trigger still renders for logged-in users but the API responds with 503 and the modal surfaces an inline error.
- See [`.env.example`](.env.example) for required env vars.

## Notes

- Source edits hot-reload; no rebuild needed.
- Rebuild (`--build`) is only needed when `package.json` changes, **and** you must `docker compose down -v` first so the anonymous `node_modules` volume gets repopulated with the new image's `node_modules`.
- `.next` and `node_modules` live in anonymous volumes — don't expect them on the host.
