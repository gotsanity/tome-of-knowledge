import Link from "next/link";
import type { LoadedNode } from "@/lib/vault/loaders";

type Props = {
  node: LoadedNode;
  nodeSlugs?: Set<string>;
};

type FacetLink = { label: string; href: string };

/**
 * Parse a frontmatter facet value into a displayable label and, when possible,
 * a link target. Handles three shapes:
 *   - `[[slug]]` / `[[slug|label]]` wikilinks (brackets always stripped)
 *   - bare slug strings (e.g. `order-of-mending`)
 *   - freeform prose (rendered as plain text)
 *
 * A link is produced only when the resolved slug exists in `nodeSlugs`, so
 * hidden/unseen targets don't turn into dead links. This runs on every
 * frontmatter-backed facet (species, affiliation, role, function, influence,
 * goal, etc.) so no vault-imported value ever renders as literal `[[...]]`.
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

function Facet({
  label,
  value,
  link,
}: {
  label: string;
  value: string;
  link?: FacetLink;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-[0.2em] text-outline">
        {label}
      </span>
      {link ? (
        <Link
          href={link.href}
          className="text-sm text-primary hover:underline decoration-1 underline-offset-4"
        >
          {link.label}
        </Link>
      ) : (
        <span className="text-sm text-on-surface-variant">{value}</span>
      )}
    </div>
  );
}

type FacetEntry = { label: string; value: string; link?: FacetLink };

function typeFacets(
  node: LoadedNode,
  nodeSlugs?: Set<string>,
): Array<FacetEntry> {
  const fm = node.frontmatter;
  const facet = (label: string, key: string): FacetEntry | null => {
    const v = fm[key];
    if (typeof v !== "string" || v.length === 0) return null;
    const parsed = parseFacetLink(v, nodeSlugs);
    return {
      label,
      value: parsed.label,
      link: parsed.href
        ? { label: parsed.label, href: parsed.href }
        : undefined,
    };
  };
  const collect = (
    ...entries: Array<[label: string, key: string]>
  ): FacetEntry[] => entries.flatMap(([l, k]) => (facet(l, k) ? [facet(l, k)!] : []));

  switch (node.type) {
    case "npc":
    case "pc":
      return collect(
        ["Species", "species"],
        ["Affiliation", "faction_affiliation"],
        ["Role", "public_role"],
      );
    case "location":
      return collect(["Function", "function"], ["Influence", "influence"]);
    case "faction":
      return collect(["Goal", "goal"], ["Influence", "influence"]);
    case "region":
      return collect(["Influence", "influence"]);
    default:
      return [];
  }
}

export function NodeHeader({ node, nodeSlugs }: Props) {
  const facets = typeFacets(node, nodeSlugs);
  const typeLabel = TYPE_LABEL[node.type];

  return (
    <header className="mb-12">
      <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-4 block">
        {typeLabel}
      </span>
      <h1 className="text-5xl lg:text-6xl font-black text-on-surface tracking-tighter leading-tight mb-6">
        {displayName(node)}
      </h1>
      {facets.length > 0 && (
        <div className="flex flex-wrap gap-8 border-b border-outline-variant/40 pb-6 mb-2">
          {facets.map((facet) => (
            <Facet
              key={facet.label}
              label={facet.label}
              value={facet.value}
              link={facet.link}
            />
          ))}
        </div>
      )}
    </header>
  );
}
