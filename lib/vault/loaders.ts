import { and, eq, inArray, notInArray, isNotNull, asc, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/lib/db/schema";
import { NODE_TYPES } from "@/lib/db/schema";
import type { NodeType, NodeVisibility } from "@/lib/db/schema";
import { canSee, isGm, type Viewer } from "./can-see";

export type LoadedSection = {
  heading: string;
  order: number;
  bodyMd: string;
};

export type LoadedNode = {
  id: string;
  slug: string;
  type: NodeType;
  name: string;
  visibility: NodeVisibility;
  depthTier: string | null;
  status: string | null;
  frontmatter: Record<string, unknown>;
  bodyMd: string;
  companionSlug: string | null;
  sourcePath: string;
  sections: LoadedSection[];
};

export type LoadedLexiconTerm = {
  slug: string;
  term: string;
  aliases: string[];
  domain: string;
  definition: string;
  usage: string | null;
  notes: string | null;
  relatedTerms: string[];
  tooltipEnabled: boolean;
};

export type RelatedNode = {
  slug: string;
  name: string;
  type: NodeType;
  visibility: NodeVisibility;
  relType: string;
  direction: "outgoing" | "incoming";
};

function parseFrontmatter(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function hydrateNode(
  row: typeof schema.nodes.$inferSelect,
  sections: Array<typeof schema.nodeSections.$inferSelect>,
): LoadedNode {
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    name: row.name,
    visibility: row.visibility,
    depthTier: row.depthTier,
    status: row.status,
    frontmatter: parseFrontmatter(row.frontmatter),
    bodyMd: row.bodyMd,
    companionSlug: row.companionSlug,
    sourcePath: row.sourcePath,
    sections: sections
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ heading: s.heading, order: s.order, bodyMd: s.bodyMd })),
  };
}

// A "companion" is a gm-notes node whose slug is referenced by another
// node's `companionSlug`. Companions only belong inline at the bottom of
// their parent page, never in nav, list, count, or related-link surfaces.
async function getCompanionSlugSet(
  db: LibSQLDatabase<typeof schema>,
): Promise<Set<string>> {
  const rows = await db
    .select({ companionSlug: schema.nodes.companionSlug })
    .from(schema.nodes)
    .where(isNotNull(schema.nodes.companionSlug));
  return new Set(
    rows
      .map((r) => r.companionSlug)
      .filter((s): s is string => typeof s === "string" && s.length > 0),
  );
}

export async function getNode(
  db: LibSQLDatabase<typeof schema>,
  slug: string,
  viewer: Viewer,
): Promise<LoadedNode | null> {
  const row = await db.query.nodes.findFirst({
    where: eq(schema.nodes.slug, slug),
  });
  if (!row) return null;
  if (!canSee(viewer, row)) return null;
  const sections = await db
    .select()
    .from(schema.nodeSections)
    .where(eq(schema.nodeSections.nodeId, row.id))
    .orderBy(asc(schema.nodeSections.order));
  return hydrateNode(row, sections);
}

export async function listNodesByType(
  db: LibSQLDatabase<typeof schema>,
  type: NodeType,
  viewer: Viewer,
): Promise<LoadedNode[]> {
  const visible: NodeVisibility[] = isGm(viewer)
    ? ["published", "draft", "gm-only"]
    : ["published"];
  const companionSlugs = await getCompanionSlugSet(db);
  const rows = await db
    .select()
    .from(schema.nodes)
    .where(eq(schema.nodes.type, type));
  const filtered = rows.filter(
    (r) => visible.includes(r.visibility) && !companionSlugs.has(r.slug),
  );
  // Sections are optional for list views; hydrate without them.
  return filtered.map((r) => hydrateNode(r, []));
}

export async function getSiteStats(
  db: LibSQLDatabase<typeof schema>,
): Promise<{
  totalNodes: number;
  mappedPlaces: number;
  lexiconTerms: number;
  eventsRecorded: number;
}> {
  const countExpr = sql<number>`count(*)`;
  const companionList = Array.from(await getCompanionSlugSet(db));
  const notCompanion =
    companionList.length > 0
      ? notInArray(schema.nodes.slug, companionList)
      : undefined;
  const [totalRows, placesRows, lexiconRows, eventsRows] = await Promise.all([
    db.select({ count: countExpr }).from(schema.nodes).where(notCompanion),
    db
      .select({ count: countExpr })
      .from(schema.nodes)
      .where(and(inArray(schema.nodes.type, ["region", "location"]), notCompanion)),
    db.select({ count: countExpr }).from(schema.lexiconTerms),
    db
      .select({ count: countExpr })
      .from(schema.nodes)
      .where(and(eq(schema.nodes.type, "event"), notCompanion)),
  ]);
  return {
    totalNodes: Number(totalRows[0]?.count ?? 0),
    mappedPlaces: Number(placesRows[0]?.count ?? 0),
    lexiconTerms: Number(lexiconRows[0]?.count ?? 0),
    eventsRecorded: Number(eventsRows[0]?.count ?? 0),
  };
}

export async function listCategoryCounts(
  db: LibSQLDatabase<typeof schema>,
  viewer: Viewer,
): Promise<Array<{ type: NodeType; count: number }>> {
  const visible: NodeVisibility[] = isGm(viewer)
    ? ["published", "draft", "gm-only"]
    : ["published"];
  const companionList = Array.from(await getCompanionSlugSet(db));
  const rows = await db
    .select({
      type: schema.nodes.type,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(schema.nodes)
    .where(
      and(
        inArray(schema.nodes.visibility, visible),
        companionList.length > 0
          ? notInArray(schema.nodes.slug, companionList)
          : undefined,
      ),
    )
    .groupBy(schema.nodes.type);
  const byType = new Map<NodeType, number>();
  for (const row of rows) {
    byType.set(row.type, Number(row.count));
  }
  return NODE_TYPES.flatMap((type) => {
    const count = byType.get(type) ?? 0;
    return count > 0 ? [{ type, count }] : [];
  });
}

export async function getRelated(
  db: LibSQLDatabase<typeof schema>,
  slug: string,
  viewer: Viewer,
): Promise<RelatedNode[]> {
  const outgoing = await db
    .select()
    .from(schema.relationships)
    .where(eq(schema.relationships.fromSlug, slug));
  const incoming = await db
    .select()
    .from(schema.relationships)
    .where(eq(schema.relationships.toSlug, slug));

  const neighborSlugs = Array.from(
    new Set([
      ...outgoing.map((r) => r.toSlug),
      ...incoming.map((r) => r.fromSlug),
    ]),
  );
  if (neighborSlugs.length === 0) return [];

  const neighborRows = await db
    .select()
    .from(schema.nodes)
    .where(inArray(schema.nodes.slug, neighborSlugs));
  const bySlug = new Map(neighborRows.map((r) => [r.slug, r]));
  const companionSlugs = await getCompanionSlugSet(db);

  const out: RelatedNode[] = [];
  const seen = new Set<string>();

  const push = (
    rel: typeof schema.relationships.$inferSelect,
    direction: "outgoing" | "incoming",
  ) => {
    const neighborSlug = direction === "outgoing" ? rel.toSlug : rel.fromSlug;
    const neighbor = bySlug.get(neighborSlug);
    if (!neighbor) return;
    if (companionSlugs.has(neighbor.slug)) return;
    if (!canSee(viewer, neighbor)) return;
    const key = `${direction}:${neighborSlug}:${rel.relType}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      slug: neighbor.slug,
      name: neighbor.name,
      type: neighbor.type,
      visibility: neighbor.visibility,
      relType: rel.relType,
      direction,
    });
  };

  for (const rel of outgoing) push(rel, "outgoing");
  for (const rel of incoming) push(rel, "incoming");

  return out;
}

export async function getLexiconTerm(
  db: LibSQLDatabase<typeof schema>,
  slug: string,
): Promise<LoadedLexiconTerm | null> {
  const row = await db.query.lexiconTerms.findFirst({
    where: eq(schema.lexiconTerms.slug, slug),
  });
  if (!row) return null;
  return {
    slug: row.slug,
    term: row.term,
    aliases: parseJsonArray(row.aliases),
    domain: row.domain,
    definition: row.definition,
    usage: row.usage,
    notes: row.notes,
    relatedTerms: parseJsonArray(row.relatedTerms),
    tooltipEnabled: row.tooltipEnabled === 1,
  };
}

export async function listLexiconTerms(
  db: LibSQLDatabase<typeof schema>,
): Promise<LoadedLexiconTerm[]> {
  const rows = await db.select().from(schema.lexiconTerms);
  return rows.map((row) => ({
    slug: row.slug,
    term: row.term,
    aliases: parseJsonArray(row.aliases),
    domain: row.domain,
    definition: row.definition,
    usage: row.usage,
    notes: row.notes,
    relatedTerms: parseJsonArray(row.relatedTerms),
    tooltipEnabled: row.tooltipEnabled === 1,
  }));
}

export async function getCompanion(
  db: LibSQLDatabase<typeof schema>,
  parentSlug: string,
  viewer: Viewer,
): Promise<LoadedNode | null> {
  if (!isGm(viewer)) return null;
  const parent = await db.query.nodes.findFirst({
    where: eq(schema.nodes.slug, parentSlug),
  });
  if (!parent?.companionSlug) return null;
  return getNode(db, parent.companionSlug, viewer);
}
