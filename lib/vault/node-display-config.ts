/**
 * Per-type display config for /node/[slug] pages.
 *
 * Maps each frontmatter field to one of two sidebar slots — marginalia
 * (boxed label/value rows) or linked-records (icon + title + relationship
 * list). The page renderer is type-agnostic and iterates these rules; no
 * per-type branching in components. To add a new field, add a rule here.
 *
 * Source of truth: CWS document-types.md v3.0. In v3.0 most of what used
 * to be type-specific frontmatter moved into body sections (rendered by
 * NodeBody) or into the paired `gm-only` companion node. The display
 * config only carries rules for fields that are still actually
 * frontmatter in v3.0.
 */

export type NodeDisplaySlot = "marginalia" | "linked-records";

/**
 * A field-level rule. `key` is the frontmatter field name; `slot` decides
 * which sidebar region it renders into. `link` resolves wikilinks against
 * the node graph. `list` means the field value is an array. `gmOnly` gates
 * the rule behind a GM viewer. `badge` on a marginalia rule renders a chip
 * rather than a label/value row.
 */
export type FieldRule = {
  key: string;
  slot: NodeDisplaySlot;
  label: string;
  link?: boolean;
  list?: boolean;
  gmOnly?: boolean;
  badge?: boolean;
};

/**
 * Universal rules that apply to every node type unless a type-specific rule
 * overrides the same `key`. Today only `status` is overridden — plotline
 * has its own content-bearing status enum that renders as a visible row
 * rather than a GM-only badge.
 *
 * `visibility` reads from the top-level `LoadedNode.visibility` column
 * (populated by the importer) — see `frontmatterValue` in Marginalia.tsx.
 * This is v3 terminology; v1 called the field `visibility_state`.
 */
export const UNIVERSAL_RULES: readonly FieldRule[] = [
  { key: "type", slot: "marginalia", label: "Type" },
  {
    key: "status",
    slot: "marginalia",
    label: "Status",
    badge: true,
    gmOnly: true,
  },
  {
    key: "visibility",
    slot: "marginalia",
    label: "Visibility",
    badge: true,
    gmOnly: true,
  },
] as const;

/**
 * Per-type field rules. Keyed by frontmatter `type` value. Any type not
 * listed here renders only universal rules.
 *
 * Ordering within each type determines marginalia / linked-records render
 * order within their respective regions. Universal rules render before
 * type-specific rules inside marginalia.
 *
 * v3.0 note: types with an empty rule list have no type-specific
 * frontmatter at all — all their content lives in body sections. These
 * pages render only the universal marginalia rows (`Type` link + GM
 * badges) plus any `related[]` linked records.
 */
export const TYPE_RULES: Record<string, readonly FieldRule[]> = {
  bestiary: [
    { key: "creature_type", slot: "marginalia", label: "Creature Type" },
  ],

  campaign: [],

  "campaign-frame": [],

  event: [
    { key: "timestamp", slot: "marginalia", label: "Timestamp" },
    {
      key: "actors",
      slot: "linked-records",
      label: "Actor",
      list: true,
      link: true,
    },
  ],

  faction: [],

  geography: [
    { key: "geography_type", slot: "marginalia", label: "Feature Type" },
    { key: "climate", slot: "marginalia", label: "Climate" },
    { key: "navigation_difficulty", slot: "marginalia", label: "Navigation" },
    {
      key: "boundaries",
      slot: "linked-records",
      label: "Borders",
      list: true,
      link: true,
    },
  ],

  handout: [],

  homebrew: [
    { key: "homebrew_type", slot: "marginalia", label: "Homebrew Type" },
    { key: "system", slot: "marginalia", label: "Game System" },
    { key: "parent_class", slot: "marginalia", label: "Parent Class" },
    { key: "inspired_by", slot: "marginalia", label: "Inspired By" },
  ],

  // v3.0 new type.
  item: [
    { key: "item_type", slot: "marginalia", label: "Item Type" },
    { key: "sentient", slot: "marginalia", label: "Sentient", badge: true },
    {
      key: "attuned_to",
      slot: "linked-records",
      label: "Attuned to",
      link: true,
    },
  ],

  location: [],

  lore: [],

  npc: [
    { key: "species", slot: "marginalia", label: "Species", link: true },
    {
      key: "faction_affiliation",
      slot: "marginalia",
      label: "Affiliation",
      link: true,
    },
  ],

  pc: [
    { key: "player", slot: "marginalia", label: "Player" },
    { key: "level", slot: "marginalia", label: "Level" },
    { key: "class", slot: "marginalia", label: "Class", link: true },
    { key: "subclass", slot: "marginalia", label: "Subclass", link: true },
    { key: "species", slot: "marginalia", label: "Species", link: true },
    { key: "heritage", slot: "marginalia", label: "Heritage", link: true },
    {
      key: "faction_affiliation",
      slot: "marginalia",
      label: "Affiliation",
      link: true,
    },
    { key: "pronouns", slot: "marginalia", label: "Pronouns" },
  ],

  plotline: [
    { key: "plotline_type", slot: "marginalia", label: "Plotline Type" },
    // Overrides UNIVERSAL_RULES.status — plotline's status is content, not
    // vault-management metadata, so it renders as a visible row for every
    // viewer and uses a different enum (dormant|active|resolved|failed|
    // abandoned).
    { key: "status", slot: "marginalia", label: "Status" },
    { key: "phase", slot: "marginalia", label: "Phase" },
    { key: "pc_affiliation", slot: "marginalia", label: "PC", link: true },
    {
      key: "depends_on",
      slot: "linked-records",
      label: "Depends on",
      list: true,
      link: true,
    },
  ],

  region: [
    { key: "identity", slot: "marginalia", label: "Identity" },
    {
      key: "dominant_conflict",
      slot: "marginalia",
      label: "Dominant Conflict",
    },
    { key: "key_resource", slot: "marginalia", label: "Key Resource" },
    {
      key: "cultural_tendency",
      slot: "marginalia",
      label: "Cultural Tendency",
    },
    {
      key: "external_dependencies",
      slot: "marginalia",
      label: "External Dependencies",
    },
    {
      key: "historical_pressure",
      slot: "marginalia",
      label: "Historical Pressure",
    },
  ],

  religion: [
    { key: "public_standing", slot: "marginalia", label: "Public Standing" },
    { key: "ethics", slot: "marginalia", label: "Ethics" },
    { key: "denominations", slot: "marginalia", label: "Denominations" },
  ],

  species: [],

  system: [
    { key: "system_type", slot: "marginalia", label: "System Type" },
    {
      key: "who_controls",
      slot: "linked-records",
      label: "Controlled by",
      link: true,
    },
  ],

  "world-overview": [],
};

/**
 * Fallback relationship label used by LinkedRecords for field-sourced
 * entries that have no typed relationship attached (event.actors,
 * geography.boundaries, system.who_controls, etc.).
 */
export const LINKED_RECORDS_FALLBACK_LABEL = "Associated with";

/**
 * Merge universal rules with a type's rules. If a type-specific rule
 * declares the same `key` as a universal rule, the type rule wins (e.g.
 * plotline.status overrides the universal status badge). Returns rules in
 * the order: universal rules first (minus overridden ones), then the
 * type-specific rules in declared order.
 */
export function rulesForType(type: string): readonly FieldRule[] {
  const typeRules = TYPE_RULES[type] ?? [];
  const overriddenKeys = new Set(typeRules.map((r) => r.key));
  const universals = UNIVERSAL_RULES.filter((r) => !overriddenKeys.has(r.key));
  return [...universals, ...typeRules];
}

/**
 * Partition the effective rules for a node into renderable buckets,
 * honoring GM-only gating. Marginalia rules split between top-line rows
 * and trailing badges so the renderer can place badges at the bottom of
 * the card without re-scanning.
 */
export type PartitionedRules = {
  marginaliaRows: FieldRule[];
  marginaliaBadges: FieldRule[];
  linkedRecords: FieldRule[];
};

export function partitionRulesForViewer(
  type: string,
  viewerIsGm: boolean,
): PartitionedRules {
  const rules = rulesForType(type);
  const result: PartitionedRules = {
    marginaliaRows: [],
    marginaliaBadges: [],
    linkedRecords: [],
  };
  for (const rule of rules) {
    if (rule.gmOnly && !viewerIsGm) continue;
    if (rule.slot === "marginalia") {
      if (rule.badge) result.marginaliaBadges.push(rule);
      else result.marginaliaRows.push(rule);
    } else {
      result.linkedRecords.push(rule);
    }
  }
  return result;
}
