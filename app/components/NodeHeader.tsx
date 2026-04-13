import type { LoadedNode } from "@/lib/vault/loaders";

type Props = {
  node: LoadedNode;
};

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

function Facet({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-[0.2em] text-outline">
        {label}
      </span>
      <span className="text-sm text-on-surface-variant">{value}</span>
    </div>
  );
}

function typeFacets(node: LoadedNode): Array<{ label: string; value: string }> {
  const fm = node.frontmatter;
  const str = (k: string): string | null => {
    const v = fm[k];
    return typeof v === "string" && v.length > 0 ? v : null;
  };

  switch (node.type) {
    case "npc":
    case "pc": {
      const out: Array<{ label: string; value: string }> = [];
      const species = str("species");
      const faction = str("faction_affiliation");
      const role = str("public_role");
      if (species) out.push({ label: "Species", value: species });
      if (faction) out.push({ label: "Affiliation", value: faction });
      if (role) out.push({ label: "Role", value: role });
      return out;
    }
    case "location": {
      const out: Array<{ label: string; value: string }> = [];
      const func = str("function");
      const influence = str("influence");
      if (func) out.push({ label: "Function", value: func });
      if (influence) out.push({ label: "Influence", value: influence });
      return out;
    }
    case "faction": {
      const out: Array<{ label: string; value: string }> = [];
      const goal = str("goal");
      const influence = str("influence");
      if (goal) out.push({ label: "Goal", value: goal });
      if (influence) out.push({ label: "Influence", value: influence });
      return out;
    }
    case "region": {
      const out: Array<{ label: string; value: string }> = [];
      const influence = str("influence");
      if (influence) out.push({ label: "Influence", value: influence });
      return out;
    }
    default:
      return [];
  }
}

export function NodeHeader({ node }: Props) {
  const facets = typeFacets(node);
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
            <Facet key={facet.label} label={facet.label} value={facet.value} />
          ))}
        </div>
      )}
    </header>
  );
}
