/**
 * Per-type display config for /node/[slug] pages.
 *
 * Maps each frontmatter field to one of three sidebar slots — marginalia
 * (boxed label/value rows), block (Translator's-Note-style quote card), or
 * linked-records (icon + title + relationship list). The page renderer is
 * type-agnostic and iterates these rules; there is no per-type branching in
 * components. To add a new field, add a rule here.
 *
 * Source of truth: frontmatter-schema.md at repo root (annotated by the
 * product owner). Keep this file in lockstep with those annotations.
 */

export type NodeDisplaySlot = "marginalia" | "block" | "linked-records";

/**
 * A field-level rule. `key` is the frontmatter field name; `slot` decides
 * which sidebar region it renders into. `link` resolves wikilinks against
 * the node graph. `list` means the field value is an array. `gmOnly` gates
 * the rule behind a GM viewer. `badge` on a marginalia rule renders a chip
 * rather than a label/value row. `render` on a marginalia rule lets callers
 * format the displayed value (the raw string is always passed through).
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
 * overrides the same `key`. Today only `status` is overridden (plotline has
 * its own status enum that renders as a marginalia row instead of a badge).
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
    key: "visibility_state",
    slot: "marginalia",
    label: "Visibility",
    badge: true,
    gmOnly: true,
  },
] as const;

/**
 * Per-type field rules. Keyed by frontmatter `type` value (a string — the
 * app's NodeType enum is a subset, but this config accepts a superset so
 * future types can be added without touching the DB schema first). Any type
 * not listed here renders only universal rules.
 *
 * Ordering within each type determines marginalia/block/linked-records
 * render order within their respective regions. Within marginalia the
 * universal rules render first (type, then badges) followed by the
 * type-specific rules in declared order. Within blocks, public blocks
 * render first and GM-only blocks render below a divider.
 */
export const TYPE_RULES: Record<string, readonly FieldRule[]> = {
  bestiary: [
    { key: "creature_type", slot: "marginalia", label: "Creature Type" },
  ],

  "campaign-frame": [],

  event: [
    { key: "timestamp", slot: "marginalia", label: "Timestamp" },
    { key: "actors", slot: "linked-records", label: "Actor", list: true, link: true },
    {
      key: "linked_nodes",
      slot: "linked-records",
      label: "Linked",
      list: true,
      link: true,
    },
  ],

  faction: [
    { key: "goal", slot: "block", label: "Goal", gmOnly: true },
  ],

  geography: [
    { key: "geography_type", slot: "marginalia", label: "Feature Type" },
    { key: "climate", slot: "marginalia", label: "Climate" },
    {
      key: "navigation_difficulty",
      slot: "marginalia",
      label: "Navigation",
    },
    { key: "scale", slot: "block", label: "Scale" },
    {
      key: "boundaries",
      slot: "linked-records",
      label: "Borders",
      list: true,
      link: true,
    },
  ],

  homebrew: [
    { key: "homebrew_type", slot: "marginalia", label: "Homebrew Type" },
    { key: "system", slot: "marginalia", label: "Game System" },
    { key: "parent_class", slot: "marginalia", label: "Parent Class" },
    { key: "inspired_by", slot: "marginalia", label: "Inspired By" },
  ],

  location: [
    { key: "function", slot: "block", label: "Function" },
    { key: "immediate_tension", slot: "block", label: "Immediate Tension" },
    {
      key: "physical_description",
      slot: "block",
      label: "Physical Description",
    },
    { key: "regular_occupants", slot: "block", label: "Regular Occupants" },
    { key: "secrets", slot: "block", label: "Secrets", gmOnly: true },
  ],

  npc: [
    { key: "species", slot: "marginalia", label: "Species", link: true },
    {
      key: "faction_affiliation",
      slot: "marginalia",
      label: "Affiliation",
      link: true,
    },
    { key: "public_role", slot: "block", label: "Public Role" },
    { key: "influence", slot: "block", label: "Influence" },
    { key: "motivation", slot: "block", label: "Motivation", gmOnly: true },
    { key: "private_goal", slot: "block", label: "Private Goal", gmOnly: true },
    { key: "weak_point", slot: "block", label: "Weak Point", gmOnly: true },
  ],

  pc: [
    { key: "player", slot: "marginalia", label: "Player" },
    { key: "level", slot: "marginalia", label: "Level" },
    { key: "class", slot: "marginalia", label: "Class", link: true },
    { key: "species", slot: "marginalia", label: "Species", link: true },
    {
      key: "faction_affiliation",
      slot: "marginalia",
      label: "Affiliation",
      link: true,
    },
    { key: "pronouns", slot: "marginalia", label: "Pronouns" },
    { key: "motivation", slot: "block", label: "Motivation" },
    { key: "private_goal", slot: "block", label: "Private Goal", gmOnly: true },
    { key: "weak_point", slot: "block", label: "Weak Point", gmOnly: true },
  ],

  plotline: [
    { key: "plotline_type", slot: "marginalia", label: "Plotline Type" },
    // Overrides UNIVERSAL_RULES.status — plotline's status is content, not
    // vault-management metadata, so it renders as a visible row for every
    // viewer and uses a different enum (dormant|active|resolved|failed|
    // abandoned).
    { key: "status", slot: "marginalia", label: "Status" },
    { key: "phase", slot: "marginalia", label: "Phase" },
    {
      key: "pc_affiliation",
      slot: "marginalia",
      label: "PC",
      link: true,
    },
    {
      key: "faction_affiliation",
      slot: "block",
      label: "Faction Affiliation",
    },
    { key: "stakes", slot: "block", label: "Stakes" },
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
    { key: "dominant_conflict", slot: "marginalia", label: "Dominant Conflict" },
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
    { key: "denominations", slot: "marginalia", label: "Denominations" },
    { key: "ethics", slot: "marginalia", label: "Ethics" },
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

  "world-overview": [
    { key: "premise", slot: "block", label: "Premise" },
    { key: "themes", slot: "block", label: "Themes", list: true },
    { key: "world_rules", slot: "block", label: "World Rules", list: true },
    { key: "core_tensions", slot: "block", label: "Core Tensions", list: true },
    { key: "prohibited", slot: "block", label: "Prohibited", list: true },
    { key: "tone_profile", slot: "block", label: "Tone Profile" },
    { key: "cosmology", slot: "block", label: "Cosmology" },
  ],

  // Types with no type-specific rules: lore, handout, campaign.
  // Only universal rules render for these.
  lore: [],
  handout: [],
  campaign: [],
};

/**
 * Fallback relationship label used by LinkedRecords for field-sourced
 * entries that have no typed relationship attached (event.actors,
 * event.linked_nodes, geography.boundaries, system.who_controls, etc.). The
 * user decided these all read as "Associated with" rather than the literal
 * field-name-humanized label — one neutral phrase reads cleaner than a
 * mix of per-field verbs.
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
 * Partition the effective rules for a node into the three sidebar slots,
 * honoring GM-only gating. Marginalia rules are further split between
 * top-line rows (the universal `type` row and other non-badge rules) and
 * trailing badges so the renderer can place them at the top vs. bottom of
 * the card without re-scanning the list.
 */
export type PartitionedRules = {
  marginaliaRows: FieldRule[];
  marginaliaBadges: FieldRule[];
  blocksPublic: FieldRule[];
  blocksGm: FieldRule[];
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
    blocksPublic: [],
    blocksGm: [],
    linkedRecords: [],
  };
  for (const rule of rules) {
    if (rule.gmOnly && !viewerIsGm) continue;
    if (rule.slot === "marginalia") {
      if (rule.badge) result.marginaliaBadges.push(rule);
      else result.marginaliaRows.push(rule);
    } else if (rule.slot === "block") {
      if (rule.gmOnly) result.blocksGm.push(rule);
      else result.blocksPublic.push(rule);
    } else {
      result.linkedRecords.push(rule);
    }
  }
  return result;
}
