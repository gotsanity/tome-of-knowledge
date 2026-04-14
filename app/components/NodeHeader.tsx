import type { LoadedNode } from "@/lib/vault/loaders";

/**
 * Parse a frontmatter facet value into a displayable label and, when possible,
 * a link target. Handles three shapes:
 *   - `[[slug]]` / `[[slug|label]]` wikilinks (brackets always stripped)
 *   - bare slug strings (e.g. `order-of-mending`)
 *   - freeform prose (rendered as plain text)
 *
 * A link is produced only when the resolved slug exists in `nodeSlugs`, so
 * hidden/unseen targets don't turn into dead links. Used by the Marginalia
 * sidebar card for link-typed frontmatter fields.
 */
export function parseFacetLink(
  raw: string,
  nodeSlugs?: Set<string>,
): { label: string; href?: string } {
  const trimmed = raw.trim();
  const wikilink = trimmed.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
  if (wikilink) {
    const slug = wikilink[1].trim();
    const label = (wikilink[2] ?? slug).trim();
    if (nodeSlugs?.has(slug)) return { label, href: `/node/${slug}` };
    return { label };
  }
  if (/^[a-z0-9][a-z0-9-]*$/.test(trimmed) && nodeSlugs?.has(trimmed)) {
    return { label: trimmed, href: `/node/${trimmed}` };
  }
  return { label: trimmed };
}

function displayName(node: LoadedNode): string {
  // CWS convention: `name:` frontmatter is the canonical slug form.
  // Only humanize when it looks like a slug (lowercase + hyphens + no spaces).
  const raw = node.name;
  if (/\s/.test(raw) || /[A-Z]/.test(raw)) return raw;
  return raw
    .split("-")
    .filter((s) => s.length > 0)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

const TYPE_LABEL: Record<LoadedNode["type"], string> = {
  npc: "Figure",
  location: "Place",
  faction: "Faction",
  region: "Region",
  species: "Species",
  religion: "Faith",
  system: "System",
  lore: "Lore Fragment",
  event: "Event",
  plotline: "Plotline",
  campaign: "Campaign",
  "campaign-frame": "Campaign Frame",
  handout: "Handout",
  bestiary: "Bestiary Entry",
  pc: "Player Character",
};

/**
 * Node-page header: eyebrow (type label) + H1. Frontmatter facets moved to
 * the Marginalia sidebar card in issue #14 — this component is now only
 * responsible for the title treatment. The tagline row renders separately
 * via NodeTagline so the header stays layout-agnostic.
 */
export function NodeHeader({ node }: { node: LoadedNode }) {
  return (
    <header className="mb-6">
      <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-4 block">
        {TYPE_LABEL[node.type]}
      </span>
      <h1 className="text-5xl lg:text-6xl font-black text-on-surface tracking-tighter leading-tight mb-6">
        {displayName(node)}
      </h1>
    </header>
  );
}
