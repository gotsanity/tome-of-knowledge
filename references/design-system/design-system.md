---
canonical: true
status: SOURCE OF TRUTH — do not modify without user decision.
updated: 2026-04-12
---

# Tome of Knowledge — Design System

> **The Scholar's Archive.** A diegetic, "in-world" reading experience that feels like a heavy, leather-bound ledger illuminated by candlelight. This document is the canonical source of truth for every design decision in the app. Do not modify without explicit user approval. Code must follow this doc; if the runtime and this doc disagree, the runtime is wrong.

## 1. Creative North Star

**"The Digital Curator."** The system rejects the sterile, flat nature of modern SaaS interfaces in favor of:

- **Asymmetrical compositions** — avoid perfectly centered layouts; margins mimic the gutter of a book.
- **Layered textures** — color shifts simulate dark vellum and aged parchment. No 1px lines for sectioning.
- **High-contrast serifs** — a single prestigious typeface across all scales for a cohesive, monographic identity.
- **Intentional density** — reading feels scholarly and authoritative, not empty.

## 2. Color

Dark, FIDELITY variant. Rooted in a "Low-Light Library" aesthetic: deep warm charcoals for ink-stained backgrounds and metallic ambers for illuminated highlights.

### 2.1 Core tokens

All colors are exposed as Tailwind theme colors via [`tailwind.config.ts`](../../tailwind.config.ts). Use them by semantic name (`bg-surface`, `text-primary`, `border-outline-variant`) — **never** hardcode `amber-*`, `stone-*`, or raw hex in page code.

| Token                        | Hex       | Use                                              |
| ---------------------------- | --------- | ------------------------------------------------ |
| `background`                 | `#0a0906` | Page root; the "candlelit floor" of the library. |
| `on-background`              | `#f9efe4` | Primary text on background.                      |
| `surface`                    | `#14120c` | Neutral surface.                                 |
| `surface-dim`                | `#14120c` | Dimmed tabletop.                                 |
| `surface-bright`             | `#211c11` | Brighter surface alt.                            |
| `surface-variant`            | `#2c261d` | Variant surface.                                 |
| `surface-tint`               | `#d4af37` | Elevation tint.                                  |
| `surface-container-lowest`   | `#0a0906` | Recessed, below the page.                        |
| `surface-container-low`      | `#1a160f` | Section backgrounds.                             |
| `surface-container`          | `#1f1a12` | Main body content areas.                         |
| `surface-container-high`     | `#262118` | Elevated widgets.                                |
| `surface-container-highest`  | `#332d24` | Floating menus / active lore entries.            |
| `on-surface`                 | `#f9efe4` | Primary text on surfaces.                        |
| `on-surface-variant`         | `#d2c5b1` | Muted copy, metadata.                            |
| `inverse-surface`            | `#f9efe4` | Light surface for inverse regions.               |
| `inverse-on-surface`         | `#211c11` | Text on inverse surface.                         |
| `outline`                    | `#807665` | Focus rings, outline borders.                    |
| `outline-variant`            | `#4e4637` | Ghost borders at 20% opacity.                    |
| `primary`                    | `#d4af37` | Gold leaf — brand, accents, CTAs.                |
| `primary-container`          | `#5c4300` | Container on primary.                            |
| `primary-fixed`              | `#ffdfa0` | Fixed light primary.                             |
| `primary-fixed-dim`          | `#eec05c` | Dim fixed primary.                               |
| `on-primary`                 | `#261a00` | Text/icon on primary.                            |
| `on-primary-container`       | `#ffdfa0` | Text on primary-container.                       |
| `inverse-primary`            | `#9c7616` | Primary for light regions.                       |
| `secondary`                  | `#dcc394` | Aged amber support color.                        |
| `secondary-container`        | `#554420` | Dark amber container.                            |
| `on-secondary`               | `#ffffff` | Text on secondary.                               |
| `on-secondary-container`     | `#fadfae` | Text on secondary-container.                     |
| `tertiary`                   | `#a8c8ff` | Ink-blue accent for linked records.              |
| `tertiary-container`         | `#194780` | Tertiary container.                              |
| `on-tertiary`                | `#ffffff` | Text on tertiary.                                |
| `on-tertiary-container`      | `#fefcff` | Text on tertiary container.                      |
| `error`                      | `#ffb4ab` | Error foreground.                                |
| `error-container`            | `#93000a` | Error background.                                |
| `on-error`                   | `#ffffff` | Text on error.                                   |
| `on-error-container`         | `#ffdad6` | Text on error container.                         |

### 2.2 The "No-Line" rule

Sectioning must never be achieved through 1px solid borders. Boundaries are defined strictly through **background shifts**. To separate a sidebar from a main content area, transition from `surface` to `surface-container-low`. The only sanctioned exceptions are: (a) the `primary` top/bottom rules on a `LoreEntry` citation, and (b) decorative ghost borders at ≤30% opacity.

### 2.3 Surface hierarchy

Treat the UI as layered vellum. Base layer is `surface-dim`; content is `surface-container`; elevated widgets are `surface-container-highest`. Recessed cards go on `surface-container-lowest` inside a `surface-container-low` region — this makes content feel engraved into the page.

### 2.4 Glass & gradient

To keep dark mode from feeling flat, use **glassmorphism** for floating elements: `surface-container-high` at 80% opacity with a 20px backdrop blur. For primary CTAs, use a subtle radial gradient from `primary` to `primary-container` to mimic the sheen of gold leaf.

### 2.5 Body backdrop

The page root uses a warm radial-dot pattern:

```css
background-color: #0a0906;
background-image: radial-gradient(#d4af3710 0.5px, transparent 0.5px);
background-size: 24px 24px;
```

Defined in [`app/globals.css`](../../app/globals.css). Do not override per-page.

## 3. Typography — Newsreader

**One typeface, every role.** Newsreader serif is loaded via `next/font/google` in [`app/layout.tsx`](../../app/layout.tsx) and exposed as CSS variable `--font-newsreader`. Tailwind maps this to `font-headline`, `font-body`, `font-label`, and `font-serif` — all identical.

- **Display** — chapter titles, hero headings. Tight letter-spacing (`tracking-tighter`, `-0.02em`) to feel like set type.
- **Headline / Title** — UI headers and navigation. Regular weight, non-aggressive.
- **Body** — long-form reading. Generous line-height (`leading-relaxed` or `leading-[1.8]`) for the "aged paper" feel.
- **Label** — small-caps or italicized for metadata, mimicking a librarian's handwritten margin notes.

**Icons** are Material Symbols Outlined via Google Fonts `<link>` in the root layout. Use `className="material-symbols-outlined"` and the glyph name as text content. Toggle fill with `style={{ fontVariationSettings: "'FILL' 1" }}`.

## 4. Shape & Radius

All corners are architectural and hand-cut:

| Token             | Value       | Meaning                                       |
| ----------------- | ----------- | --------------------------------------------- |
| `rounded`         | `0.125rem`  | Default. Precise, architectural.              |
| `rounded-lg`      | `0.25rem`   | Slightly softer.                              |
| `rounded-xl`      | `0.5rem`    | Rarely used; only for pill-ish containers.    |
| `rounded-full`    | `0.75rem`   | "Full" = the floating editor toolbar pill.    |

Never use `rounded-2xl`, `rounded-3xl`, or true circles except for profile avatars. Bubbly shapes break the manuscript feel.

## 4.5 Layout & Content Width

### Content area width

All standard content pages (`/contents`, `/entry`, `/scribe`, and any future reading-view route) share a single content wrapper:

```tsx
<div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-12">
  {/* page content */}
</div>
```

`max-w-screen-xl` (1280px) is the canonical reading width inside the `AppShell`. Do not use `max-w-4xl`, `max-w-5xl`, or other narrow constraints for primary content — the sidebar already narrows the viewport, and a second narrow column makes the layout feel cramped. The landing page is the only exception: its hero and bento grid use `max-w-[1400px] mx-auto px-12` because the marketing surface is wider than a reading surface.

### Sidebar + top bar chrome

The `AppShell` shell contributes:
- Left: `w-72` sidebar (fixed, sticky, `border-r border-stone-800`)
- Top: sticky `TopAppBar` with `py-6 px-12` internal padding
- Right: decorative corner SVG (`fixed bottom-0 right-0 w-32 h-32 opacity-20`)

Pages own everything inside `<main>`. They must not re-introduce their own top bar, sidebar, or footer chrome.

## 5. Elevation & Depth

Traditional drop shadows are too "modern." Use tonal layering instead.

- **Layering** — recessed cards on `surface-container-lowest` inside a `surface-container-low` section feel engraved.
- **Ambient shadow** — when something must float (modal, FAB), use massive blur (~48px) with `on-surface` at 5% opacity.
- **Ghost border** — `outline-variant` at 20% opacity. Felt, not seen.
- **Glow** — primary CTAs gain a warm `shadow-lg shadow-primary/10` on hover.
- **Parchment glow** — the scribe editor canvas uses `.parchment-glow` (`box-shadow: 0 0 40px rgba(156,118,22,0.05)`).

## 6. Components — Shared shell

All pages must consume the shared shell in [`app/components/`](../../app/components/). Do not re-create bespoke nav, brand wordmarks, or layout wrappers.

### `AppShell`
Wraps every page. Composes `SideNavBar`, `TopAppBar`, `<main>`, and the decorative corner SVG. Pages pass `active: NavKey` and their content as `children`.

### `SideNavBar` (w-72)
The canonical sidebar. Single source of nav items: `library`, `contents`, `scribe`, `archived`. Active state: `text-primary font-bold border-r-2 border-primary bg-stone-800/50 translate-x-1`, with the icon glyph filled via `fontVariationSettings`. Inactive: `text-stone-400` with `hover:bg-stone-800 hover:text-primary`.

- Header: 40×40 `bg-primary/20` square with `menu_book` glyph, "The Archivist" title, "Great Library of Oakhaven" subtitle.
- "New Entry" button: full-width `bg-primary/10 border border-primary/20 text-primary`.
- Footer: 40×40 avatar tile, "Elder Thorne / Master of Records".

### `TopAppBar`
Sticky. `bg-stone-950/80 backdrop-blur-md`, border-bottom `border-stone-800/20`. Two flex groups separated by `justify-between`:

- **Left group** — brand `<Link href="/">Tome of Knowledge</Link>` in `text-primary text-2xl font-black uppercase tracking-tighter` adjacent to nav links (`Characters`, `Homebrew`) in `text-stone-400 hover:text-primary`. Brand and primary nav always travel together on the left.
- **Right group** — search field in `bg-stone-900/50` (w-64, rounded-sm, leading search glyph) and trailing `account_circle` glyph.

The brand **must** be a link to `/`. Do not render the brand as a plain text div on any page.

### `Button`
Central button component. Variants:

| Variant     | Look                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| `primary`   | Gold fill (`bg-primary text-on-primary`), subtle `shadow-primary/10`, hover brightens. |
| `secondary` | Transparent with `border-stone-700 text-stone-300`, hover `bg-stone-800`.   |
| `ghost`     | Transparent, `text-stone-400`, hover `text-primary`.                        |

Sizes: `sm` (`px-4 py-2 text-xs`) and `md` (`px-8 py-3 text-sm`). Optional `icon` prop renders a leading Material Symbol. Always uppercase, `font-bold tracking-widest`.

### `SectionHeading`
`<h2>` in `text-4xl font-black text-on-surface` followed by a horizontal rule gradient (`h-px bg-gradient-to-r from-primary/30 to-transparent`) and an optional actions slot.

## 7. Page patterns

### Landing (`/`)

**Hero band** — `min-h-[720px]`, `flex flex-col`, layered gradient backdrop with absolute inset-0 wash (`from-stone-950 via-stone-900 to-stone-950 opacity-90` + `from-background via-transparent to-stone-950/60`). Content is a `flex-1` centered column containing a pill kicker (`border-y border-primary/30 text-primary`), 6xl/8xl italic `text-on-surface` headline, paragraph lede, and a two-button CTA row (primary + secondary `Button`). The animated **Scroll to Descend** indicator is a **sibling flex child** below the content with `pb-8` — never absolutely positioned, so it can never overlap the buttons.

**Lexicon section** — `max-w-[1400px] mx-auto px-12 py-24`, `SectionHeading` with grid/list view toggles in the actions slot, then a bento grid: `md:col-span-7` featured card + `md:col-span-5` stacked secondary column + a `md:col-span-12` 4-column marginalia row.

**Statistics + footer** — `bg-stone-950 border-t border-stone-800/50`. Two distinct layout regions:

1. **Stats grid** — constrained to `max-w-[1400px] mx-auto px-12 pt-16`. A 4-up icon + numeric value + uppercase label grid.
2. **Sub-footer** — **full page width** (no max-width wrapper), `pt-12 pb-16 px-12 border-t border-stone-900`. Three groups:
   - **Left** — brand wordmark in `text-primary italic` + tagline in `text-stone-500 text-sm max-w-xs`.
   - **Center** — secondary links (`Privacy Scroll`, `Library Rules`, `Contact Archivist`) in `text-[10px] uppercase tracking-widest font-bold`. These are **absolutely positioned** at `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2` so they remain centered on the viewport regardless of the widths of the left and right groups. A mobile-only (`md:hidden`) duplicate of the links sits in the flex flow for stacked layouts.
   - **Right** — social icon tiles (`w-8 h-8 border border-stone-800`).

Using flex `justify-between` for three unequal children would push the middle off-center; the absolute + translate pattern is the sanctioned way to center a middle group on the viewport.

> **All three reading-view pages below share the same content wrapper**: `max-w-screen-xl mx-auto px-8 lg:px-16 py-12`. See §4.5.

### Table of Contents (`/contents`)
Centered header with ornamental SVG + italic subtitle + `Volume XIV • Second Era` eyebrow. Roman-numeral sections (`text-4xl font-bold text-primary`) over a `bg-primary/20` ledger rule. Rows use `.leader-dots` for dotted leaders between title and page number. Optional two-column layout per section. Asymmetric "featured plate" image card on the left, marginalia text on the right. End-of-index footer with glyph cluster.

### Entry detail (`/entry`)
12-column grid (`lg:col-span-8` body + `lg:col-span-4` sidebar). Eyebrow `Manuscript Fragment #NNN`, 6xl black title, italic meta row with `⬥` separator. Body uses `.drop-cap` on the first paragraph. Callout dividers use a small diamond SVG in `fill-primary/40` over a centered horizontal rule. Tag footer with `bg-primary/10 border border-primary/20 text-primary` pills. Sticky marginalia sidebar: metadata card with label pairs, translator's note with left accent bar, linked records list. Floating ink-pen FAB in `bg-primary text-on-primary` links to `/scribe`.

### Scribe desk (`/scribe`)
Editor header with eyebrow / title / annotation note + two buttons (`Drafts` secondary, `Seal & Save` primary with `workspace_premium` icon). Parchment canvas (`bg-stone-900/40 border border-primary/5 p-12 lg:p-20 .parchment-glow min-h-[819px]`) with corner flourish SVGs and a floating pill toolbar (`bg-black/40 backdrop-blur-md rounded-full`). Editable blocks use `contentEditable` + `suppressContentEditableWarning`. First paragraph gets `.drop-cap-sm`. Marginalia callout with left primary bar and floating icon anchor. Page-break ornament is a diamond-on-line SVG. Metadata footer shows character / word counts and a sync pulse indicator.

## 8. Do's and Don'ts

### Do
- Use `AppShell` on every page.
- Use semantic color tokens (`primary`, `on-surface`, `outline-variant`).
- Reach for shared components (`Button`, `SectionHeading`) before hand-rolling.
- Embrace asymmetry — metadata belongs in the margins, not the center.
- Stick to the `rounded` (2px) default. Precise, hand-cut.
- Tint shadows warm when you must use them.

### Don't
- No pure white (`#FFFFFF`). Use `on-background` (`#f9efe4`).
- No hardcoded `amber-*` / `stone-*` / hex in page code — use tokens.
- No icon-only buttons in primary flows — a scholar reads, not guesses.
- No grid-heavy 3-/4-column card layouts. Use tiered lists or staggered bento.
- No `rounded-2xl` / `rounded-3xl` / bubbly shapes.
- No bespoke sidebars or brand wordmarks per page.

## 9. Governance

This document and [`tokens.json`](./tokens.json) are **canonical**. The runtime Tailwind config and component styles must conform to them, not the other way around. If a design change is needed:

1. Discuss and decide with the user.
2. Update `tokens.json` + `design-system.md` first.
3. Then propagate to [`tailwind.config.ts`](../../tailwind.config.ts), [`app/globals.css`](../../app/globals.css), and shared components.
4. Run the pages and verify visual conformity.

Stitch remains a useful ideation / wireframing tool, but its output is not canonical — once a decision lands here, this document wins.
