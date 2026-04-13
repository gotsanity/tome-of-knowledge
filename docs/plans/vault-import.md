# Phase Plan: Vault Import & Reader

Import CWS vault nodes into the database and render them through role-aware detail pages. Read-only in this phase — no editing through the app.

## Source of truth

CWS plugin spec (installed for the user, not in repo):
`C:\Users\gotsa\.claude\plugins\marketplaces\sanity-plugins\plugins\cws\`

Key files:
- `schema/document-types.md` — 15 node types, required/optional fields
- `schema/relationship-types.md` — 14 base relationship types with inverses
- `templates/` — frontmatter shapes per type (templates are scaffolding, not literal bodies — section content is author prose, not template prompts)
- `schema/visibility-model.md` (zero-trust) — `draft` / `published` / `gm-only`

## Decisions (locked)

1. **Vault location** — outside repo, path from `VAULT_PATH` env var. Importer takes it as a flag or env.
2. **Node types** — all 15 imported in this phase.
3. **Body rendering** — on request (server-side) via `remark`. No `body_html` column.
4. **Plotlines + events** — imported now. All `draft` and `gm-only` visibility is gated behind the GM role.
5. **Lexicon** — vault-level (read from `world/LEXICON.md`). Terms are **individual detail pages** using the same page shell as nodes (`/lexicon/[slug]`). No dedicated `/lexicon` index page. Wikilinked lexicon terms get a hover tooltip in body prose.

## Database schema

New Drizzle migration adds:

### `nodes`
| column | type | notes |
|---|---|---|
| `id` | text pk | uuid |
| `slug` | text unique | kebab-case canonical name |
| `type` | text enum | 15 CWS types |
| `name` | text | display name |
| `visibility` | text enum | `draft` / `published` / `gm-only` |
| `depth_tier` | text | `overview` / `detail` / etc. |
| `status` | text | `draft` / `active` / `retired` |
| `frontmatter` | text (JSON) | type-specific fields as JSON blob |
| `body_md` | text | raw markdown |
| `companion_slug` | text nullable | FK → nodes.slug |
| `source_path` | text | absolute path in vault at import time |
| `created_at` | integer | ms timestamp |
| `updated_at` | integer | ms timestamp |

Indexes: `slug` (unique), `type`, `visibility`, `(type, visibility)`.

**Rationale:** JSON `frontmatter` avoids 15 per-type tables. Hot query fields can be promoted to columns later if JSON1 performance is insufficient.

### `node_sections`
| column | type | notes |
|---|---|---|
| `id` | text pk | |
| `node_id` | text fk | → nodes.id, cascade |
| `heading` | text | e.g., `## Overview` |
| `order` | integer | preserve authoring order |
| `body_md` | text | section markdown |

Enables independent section rendering (useful for marginalia and future publish-state toggling).

### `relationships`
| column | type | notes |
|---|---|---|
| `id` | text pk | |
| `from_slug` | text | |
| `to_slug` | text | |
| `rel_type` | text enum | 14+ CWS relationship types |
| `source` | text enum | `explicit` / `inverse` |

Unique on `(from_slug, to_slug, rel_type)`. Importer derives inverses so both directions are queryable with a single filter.

### `lexicon_terms`
| column | type | notes |
|---|---|---|
| `id` | text pk | |
| `slug` | text unique | kebab-case |
| `term` | text | canonical label |
| `aliases` | text (JSON array) | |
| `domain` | text | `CWS` / `World` / `RPG` |
| `definition` | text | |
| `usage` | text nullable | |
| `notes` | text nullable | |
| `related_terms` | text (JSON array) | slugs |
| `tooltip_enabled` | integer (0/1) | default 1; set to 0 to opt out of prose tooltips |

Separate from `nodes` because shape diverges (no relationships, no companion, no visibility tiers — terms are always player-visible unless a later phase adds gated terms).

### `themes` + `node_themes`
Lookup table for theme tags and a join table to nodes. Enables filtering nodes by theme.

## Importer pipeline

**Entry point:** `scripts/import-vault.ts`, runnable via `npm run vault:import`. Reads `VAULT_PATH` from env (or `--path` flag override).

**Steps:**
1. Walk `VAULT_PATH` recursively. Skip `indexes/`, `tasks/`, `constraints/`, `.cws/`, and anything outside `world/` (those are operational/derived, not content).
2. Parse each `.md` file with `gray-matter` → frontmatter + body.
3. Split body into sections at `##` headings (preserve order).
4. **First pass:** upsert every node by slug. All rows written before relationships are resolved so cross-references always land.
5. **Second pass:** walk every `related[]` entry and every `[[wikilink]]` in body prose, inserting into `relationships`. Derive inverses per the 14-type rulebook and mark them `source: 'inverse'`. Dedupe on `(from, to, rel_type)`.
6. **Lexicon pass:** parse `world/LEXICON.md` into `lexicon_terms`. Each `## Term Name` heading becomes a row; fields are extracted from the `**Domain:**` / `**Definition:**` / `**Usage:**` / `**Related:**` / `**Notes:**` lines.
7. **Validation:**
   - Reject `visibility: published` nodes containing forbidden headings (`## Secrets`, `## Notes`, `## Hooks`, `## True Account`, `## Private Goal`, `## Weak Point`). Log and skip — don't fail the whole import.
   - Warn on orphan wikilinks (pointing to slugs with no matching row).
   - Warn on companion links where the companion file isn't found.
8. **Idempotent:** entire import runs in one transaction; on re-run, truncate vault-sourced rows and re-insert. Manual edits through the app (future phase) would use a separate origin marker — not in this phase.

## Loaders

All in `lib/vault/` and server-only:

- `getNode(slug)` — returns the node + sections + relationships, honoring `canSee`
- `listNodesByType(type)` — filtered by role
- `getRelated(slug)` — both directions via the relationships table
- `getLexiconTerm(slug)` — term lookup
- `listLexiconTerms()` — for tooltip matching (cached)
- `getCompanion(slug)` — returns the `gm_companion` node, GM only, 404 otherwise

### Access control

Single helper `canSee(user, node)`:
- `published` → everyone
- `draft` → GM only
- `gm-only` → GM only

Applied in every loader. Non-GM users hitting a hidden slug get a plain 404 — don't leak existence. GM role is determined via the existing `getSessionUser()` helper from phase 1.

## Rendering pipeline

`remark` + `remark-gfm` + custom plugins, server-side:

1. **Wikilink plugin** — rewrites `[[slug]]` and `[[Display Name]]` to internal links. If the slug matches a `lexicon_terms` row, link points to `/lexicon/<slug>`; otherwise `/node/<slug>`. Case-insensitive; normalizes to kebab-case.
2. **Lexicon tooltip plugin** — walks text nodes inside `<p>`, `<li>`, `<blockquote>`; skips headings, code, and existing links. Matches term + aliases (exact, case-insensitive, word-boundary). Wraps first occurrence per paragraph only. Terms with `tooltip_enabled = 0` are skipped.
3. Output: React tree with custom components (`<WikiLink>`, `<LexiconTooltip>`).

## Routes

- **`/node/[slug]`** — universal detail page, type-aware header (NPC shows species/faction, location shows function/influence, etc.). Sections render in order. Right sidebar for related nodes + themes. For GMs: a "GM Notes" panel that loads the companion node.
- **`/lexicon/[slug]`** — term detail page using the same shell (header + body + related terms). Same visual language as nodes.
- **`/contents`** — real data, grouped by type, filtered by role. Replaces the current stub.

Existing `/`, `/entry`, `/scribe` routes remain as-is for this phase.

## Components

- **`<WikiLink>`** — server component, renders `<Link>` with hover preview (later phase).
- **`<LexiconTooltip>`** — client component. Hover/focus trigger. Fetches `/api/lexicon/<slug>` once per slug and caches in a module-level map. Keyboard accessible (ARIA).
- **`<NodeHeader>`** — type-aware header fragment. Dispatches on `node.type`.
- **`<Marginalia>`** — right-rail component showing related nodes, themes, and GM-only companion link.

## Tradeoffs & flagged risks

- **Lexicon over-matching** — common words like "river" or "temple" could match too aggressively. Mitigations: word-boundary matching, first occurrence per paragraph only, `tooltip_enabled = 0` opt-out per term, skip matches inside existing links.
- **Wikilink case handling** — `[[Fort Ashby]]`, `[[fort-ashby]]`, `[[fort ashby]]` all normalize to the same slug. Importer and renderer share the normalizer.
- **`related` inverse conflicts** — if a vault file manually specifies an edge already derived as an inverse, dedupe on `(from, to, rel_type)`.
- **JSON1 limits** — SQLite JSON filtering is weaker than Postgres JSONB. For filtering on type-specific fields (e.g., `faction_affiliation`), promote to columns or denormalize later. Not a phase-1 blocker.
- **Re-import destroys manual edits** — no app-side editing exists yet, so this is fine now. When editing lands in a later phase, importer needs an origin marker to avoid clobbering user edits.
- **Large vaults** — full walk + transaction could be slow at vault scale. Acceptable for MVP; add incremental import if it becomes painful.

## Out of scope (this phase)

- Editing nodes through the app.
- Auto-sync / file watching — import is manual.
- Full-text search.
- Theme-based discovery UI.
- Publish-state toggling per section.
- Companion auto-creation on missing file.

## Implementation order

1. **Schema + migration** — add `nodes`, `node_sections`, `relationships`, `lexicon_terms`, `themes`, `node_themes`. Run `db:generate`.
2. **Importer** — walk, parse, two-pass upsert, inverse derivation. No rendering yet; verify with `db:studio`.
3. **Loaders + access control** — server-only functions in `lib/vault/`, `canSee` helper.
4. **`/node/[slug]`** with plain markdown rendering (no wikilink rewriting yet). Confirm data flows end-to-end.
5. **Lexicon importer pass + `/lexicon/[slug]`** route with the same shell.
6. **Wikilink rewriter** — remark plugin rewriting `[[slug]]` to links, routing lexicon matches to `/lexicon/`.
7. **Lexicon tooltip** — remark plugin + `<LexiconTooltip>` client component + `/api/lexicon/<slug>` endpoint.
8. **`/contents`** wired to real data with role filter.
9. **Companion rendering on GM node view** — "GM Notes" panel that loads the companion via `gm_companion` frontmatter.

## Environment

New env var: `VAULT_PATH` (absolute path to CWS vault root). Add to `.env.example`.

## Dependencies to add

Runtime:
- `gray-matter` — frontmatter parsing
- `remark`, `remark-parse`, `remark-gfm`, `remark-rehype`, `rehype-react` (or equivalent) — markdown rendering
- `unist-util-visit` — for custom plugins

Dev (test harness — this phase is the first with tests):
- `vitest` — test runner (ESM + TS native, fast watch)
- `@vitest/coverage-v8` — coverage reporting
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` — component tests for `<LexiconTooltip>` etc.
- `happy-dom` — lightweight DOM for component tests (faster than jsdom)
- `vitest-axe` (or `jest-axe` via vitest) — accessibility assertions on rendered components
- `@playwright/test` — E2E browser tests for role-gated routing, wikilink navigation, and GM companion reveal

Dev (linting — the existing `lint` script is currently non-functional; this phase wires it up properly):
- `eslint` — linter
- `eslint-config-next` — Next.js 15 preset (covers React, React Hooks, a11y, core-web-vitals)
- `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` — TS-aware rules
- `eslint-plugin-vitest` — lint rules for test files

Scripts added to `package.json`:
- `test` — `vitest run`
- `test:watch` — `vitest`
- `test:coverage` — `vitest run --coverage`
- `test:e2e` — `playwright test`
- `lint` — already exists; now functional with config + deps
- `typecheck` — `tsc --noEmit`
- `check` — `npm run lint && npm run typecheck && npm run test` (fast gate run on every commit)
- `check:full` — `npm run check && npm run test:e2e` (full gate including E2E, run before merge)

## Test execution environment

- Vitest runs on the **host**, not inside the Docker container. Fixture vault is under `tests/fixtures/vault/` (repo-relative, portable).
- Playwright runs against `docker compose up` locally and against a spun-up container in CI. One smoke project (Chromium) for this phase; WebKit/Firefox added later only if cross-browser bugs surface.
- Node version for host execution must match the Docker image (Node 20). Enforced via `.nvmrc` added in step 0.

## Test strategy (TDD — tests lead implementation)

Per project workflow rule (see CLAUDE.md), every module in this phase is written test-first. A failing test exists before the code that satisfies it; the implementation order below is explicit about this.

### Test layout

```
tests/
  fixtures/
    vault/                  # minimal checked-in CWS-shaped vault
      world/
        npcs/
        locations/
        factions/
        LEXICON.md
      ...
  unit/
    slug.test.ts
    wikilink-parser.test.ts
    inverse-rules.test.ts
    lexicon-parser.test.ts
    section-splitter.test.ts
    visibility.test.ts
    can-see.test.ts
  integration/
    importer.test.ts        # runs importer against fixture vault into :memory: sqlite
    loaders.test.ts         # seeds DB, exercises lib/vault/ loaders under user + GM
    wikilink-plugin.test.ts # remark pipeline in isolation
    tooltip-plugin.test.ts
  component/
    LexiconTooltip.test.tsx
    NodeHeader.test.tsx
```

### Unit test coverage (pure functions — highest ROI)

| Module | What the tests pin down |
|---|---|
| `lib/vault/slug.ts` | `normalizeSlug("Fort Ashby")` → `"fort-ashby"`; handles diacritics, punctuation, already-kebab input, idempotency. |
| `lib/vault/wikilink-parser.ts` | Extracts `[[slug]]`, `[[Display Name]]`, `[[slug|alias]]`. Ignores code fences and inline code. Returns span offsets for rewrite. |
| `lib/vault/inverse-rules.ts` | All 14 CWS relationship types → correct inverse (e.g. `parent_of` ↔ `child_of`, `allied_with` self-inverse). Table-driven tests; one case per type. |
| `lib/vault/lexicon-parser.ts` | Parses `world/LEXICON.md` sample: term, aliases, domain, definition, usage, related. Handles missing optional fields. |
| `lib/vault/section-splitter.ts` | Splits body at `##` headings preserving order; handles body with no headings (single section). |
| `lib/vault/visibility.ts` | `published` node containing forbidden heading → validation error. `gm-only` node with same heading → allowed. |
| `lib/auth-helpers.ts::canSee` | Matrix: 3 visibilities × {anonymous, user, gm} = 9 cases. |

### Integration tests

- **`importer.test.ts`** — runs `scripts/import-vault.ts` logic against `tests/fixtures/vault/` into an in-memory SQLite DB. Asserts: node count, section count, explicit + derived inverse relationships, lexicon terms, companion linking, idempotency (run twice → same row count), forbidden-heading rejection, orphan-wikilink warning captured in result log. **Error budget:** importer exits non-zero if `errors.length > 0` *or* `warnings.length > errorBudget` (default 10); test includes a fixture variant with 11 orphan wikilinks that asserts non-zero exit. Silent partial imports must be impossible.
- **`loaders.test.ts`** — seeds DB from fixture, calls `getNode`/`listNodesByType`/`getRelated`/`getLexiconTerm` as user and GM. Asserts: draft and gm-only nodes 404 for user, returned for GM; GM companion loads only for GM.
- **`wikilink-plugin.test.ts`** — feeds markdown containing `[[slug]]`, `[[Display]]`, and a lexicon term match through the remark pipeline; asserts output AST has `<WikiLink>` nodes with correct href routing (`/node/` vs `/lexicon/`).
- **`tooltip-plugin.test.ts`** — asserts: match only first occurrence per paragraph, skip headings/code/existing-links, skip terms with `tooltip_enabled = 0`, word-boundary correctness (`"river"` does not match `"rivers"` unless aliased).

### Component tests

- **`LexiconTooltip.test.tsx`** — mocks `/api/lexicon/<slug>` fetch, asserts hover shows tooltip, keyboard focus shows tooltip, cache prevents duplicate fetches, ARIA attributes present. Axe assertion: `expect(await axe(container)).toHaveNoViolations()` in both closed and open states.
- **`NodeHeader.test.tsx`** — renders NPC, location, faction fixtures; asserts type-specific fields appear (species for NPC, function for location, etc.). Axe pass on each type variant.

### Accessibility tests

Every component test file runs a `vitest-axe` assertion. Failing axe = failing test. Covers the highest-risk surface (tooltip interactions, type-aware headers). Page-level a11y is covered by Playwright's `@axe-core/playwright` check on the happy-path E2E flows.

### E2E tests (Playwright)

One spec file per user journey, small and focused:

- **`auth-gated-routing.spec.ts`** — anonymous user hitting a `draft` slug gets a plain 404 (existence not leaked). Logged-in user same. GM sees the content.
- **`wikilink-navigation.spec.ts`** — click a `[[slug]]` in rendered prose, land on `/node/<slug>`. Click a lexicon term link, land on `/lexicon/<slug>`.
- **`gm-companion-reveal.spec.ts`** — GM viewing a node with a `gm_companion` sees the "GM Notes" panel; a regular user does not see the panel and hitting the companion slug directly 404s.
- **`lexicon-tooltip.spec.ts`** — hover a matched term in prose, tooltip appears with definition. Keyboard focus equivalent. `@axe-core/playwright` run on this page.

Playwright uses a dedicated test database seeded from the fixture vault. Teardown drops the DB file. No shared state between specs.

### Out of test scope (this phase)

- Full `/node/[slug]` page E2E — no Playwright yet; defer to a later phase that adds it.
- Performance/large-vault tests — fixture vault is minimal.
- Visual regression on rendered markdown — covered by later UI review.

### Regression discipline

- Tests are additive: this phase establishes the suite and the rule is that no test is deleted to unblock a change. If behavior legitimately changes later, the test is updated in the same commit as the code.
- `npm run check` (lint + typecheck + unit/integration/component tests) is the fast gate, run on every commit. `npm run check:full` adds Playwright E2E and is run before merge. Individual steps below are only "done" when `check:full` is green.
- ESLint rules are not disabled ad-hoc on a per-file basis. If a rule is genuinely wrong for this codebase, disable it in the shared config with a comment explaining why.
- The fixture vault is **checked into the repo** under `tests/fixtures/vault/` — decoupled from the user's real `VAULT_PATH` so tests are deterministic and safe to run anywhere.

### Migrations & rollback

- Drizzle migrations are **forward-only** and gated by `instrumentation.ts` at boot. There is no automated down-migration — this is a deliberate simplification matching the SQLite single-file model.
- Recovery path if a migration ships broken: (1) fix the migration in a new migration file (never edit a committed migration), (2) if data is corrupt, the `tome-data` named volume is the source of truth and can be snapshotted via `docker run --rm -v tome-data:/data -v "$PWD":/backup alpine tar czf /backup/tome-data.tgz /data` before any risky schema change.
- Before running `npm run db:generate` on schema changes in this phase, take a snapshot of `tome-data` if there's non-disposable seed data. Document the snapshot step in commit messages that touch migrations.
- Test coverage: a migration integration test applies every migration in order against `:memory:` and asserts the final schema matches the Drizzle schema definitions. Catches out-of-order or malformed migrations before they reach instrumentation.

### UI design review gate

After any step that adds or changes UI (steps 5, 6, 8, 9, 10 below), invoke the **`ui-design-system-guardian`** agent in **review mode** against the changed files. The agent produces a findings report measured against [`references/design-system/design-system.md`](../../references/design-system/design-system.md) and [`tokens.json`](../../references/design-system/tokens.json). The step is not done until:
- All findings are resolved (fix the code, or — with explicit user decision — update the design system files first per the change protocol in CLAUDE.md), and
- `npm run check:full` is green.

The agent is invoked by the assistant; it is not wired into an npm script because it's a Claude subagent, not a CLI tool. Process rule enforced at the point of sign-off.

## Implementation order (TDD)

Each step below is: **write failing test → minimal code to pass → refactor → commit**. Schema and importer come first because everything downstream depends on them.

0. **Test + lint + E2E harness bootstrap** —
   a. Add vitest + deps (`vitest`, `@vitest/coverage-v8`, `@testing-library/*`, `happy-dom`, `vitest-axe`). `vitest.config.ts` with happy-dom env and `@/` path alias. Hand-author `tests/fixtures/vault/` (6–10 nodes across visibility tiers, 3–4 rel types, `LEXICON.md` with 5 terms). Add `test` / `test:watch` / `test:coverage` scripts. Add `.nvmrc` pinning Node 20 to match Docker. Commit: green empty suite.
   b. Add ESLint deps, generate `.eslintrc.json` (or flat `eslint.config.mjs`) extending `next/core-web-vitals` + `next/typescript` + vitest plugin for `tests/**`. Add `typecheck` and `check` scripts. Run `npm run check` and fix any pre-existing violations in the current codebase (auth phase files, components). Commit: green `check` baseline.
   c. Add Playwright (`@playwright/test`, `@axe-core/playwright`), `playwright.config.ts` targeting Chromium only for this phase, pointing at `http://localhost:3000` with a `webServer` block that boots `docker compose up`. Create a test-DB seeding helper that imports the fixture vault into a throwaway SQLite file before each spec file and cleans up after. Add `test:e2e` and `check:full` scripts. Commit: Playwright installed with one sanity spec that loads `/` and passes. This is the regression baseline — nothing in subsequent steps may ship unless `check:full` stays green.
1. **Schema + migration** — add Drizzle schema for `nodes`, `node_sections`, `relationships`, `lexicon_terms`, `themes`, `node_themes`. Run `db:generate`. *Test*: migration applies cleanly to `:memory:` DB in an integration harness fixture.
2. **Pure helpers (unit test-first)** — `slug.ts`, `section-splitter.ts`, `wikilink-parser.ts`, `inverse-rules.ts`, `visibility.ts`, `lexicon-parser.ts`. Each lands with its unit test file written first.
3. **Importer** — walk + parse + two-pass upsert + inverse derivation, orchestrating the helpers from step 2. `importer.test.ts` drives the design; asserts run against in-memory DB seeded from the fixture vault.
4. **`canSee` + loaders** — unit test `canSee` matrix first, then build `lib/vault/` loaders against the seeded fixture DB (`loaders.test.ts`).
5. **`/node/[slug]` with plain markdown** — minimal render, no wikilink rewriting yet. Smoke-level component test: page renders title + body for a fixture slug. Axe pass. Add `auth-gated-routing.spec.ts` E2E. **UI guardian review** before sign-off.
6. **Lexicon route + importer pass** — `/lexicon/[slug]` reusing the page shell. Lexicon parser already tested; add a loader test. Axe pass on the new route. **UI guardian review** before sign-off.
7. **Wikilink remark plugin** — `wikilink-plugin.test.ts` drives the plugin. Rewrite `[[...]]` → `/node/<slug>` or `/lexicon/<slug>`. Add `wikilink-navigation.spec.ts` E2E. No UI review needed (no new surface).
8. **Lexicon tooltip** — `tooltip-plugin.test.ts` for the remark side, `LexiconTooltip.test.tsx` (with axe) for the client side. Add `/api/lexicon/<slug>` endpoint with its own integration test. Add `lexicon-tooltip.spec.ts` E2E with `@axe-core/playwright` check. **UI guardian review** before sign-off.
9. **`/contents` wired to real data** — role-filtered list. Loader test covers the filter; page is a thin consumer. Axe pass. **UI guardian review** before sign-off.
10. **GM companion panel** — loader test for `getCompanion` (404 for user, returns for GM), then UI on the node page. Add `gm-companion-reveal.spec.ts` E2E covering both GM and non-GM paths. **UI guardian review** before sign-off.

## Open for revisit after implementation

- Whether `relationships` should be a graph structure with a traversal query helper, or stay flat.
- Whether lexicon tooltips should cache per-page-load in a server component or per-session on the client.
- Whether `frontmatter` JSON should be parsed eagerly on load or on access.
