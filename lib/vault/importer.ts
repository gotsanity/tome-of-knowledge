import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/lib/db/schema";
import type { NodeType, NodeVisibility } from "@/lib/db/schema";
import { NODE_TYPES } from "@/lib/db/schema";
import { normalizeSlug } from "./slug";
import { splitSections } from "./section-splitter";
import { extractWikilinks } from "./wikilink-parser";
import { inverseOf } from "./inverse-rules";
import { validateNodeVisibility } from "./visibility";
import { parseLexicon } from "./lexicon-parser";

export type ImportResult = {
  errors: string[];
  warnings: string[];
  stats: {
    nodesImported: number;
    sectionsImported: number;
    relationshipsImported: number;
    lexiconTermsImported: number;
  };
};

export type ImportOptions = {
  warningBudget?: number;
};

const SKIP_DIRS = new Set([
  "indexes",
  "tasks",
  "constraints",
  ".cws",
  ".git",
  "node_modules",
]);

type ParsedNodeFile = {
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
  sections: Array<{ heading: string; order: number; bodyMd: string }>;
  explicitRelated: Array<{ targetSlug: string; relType: string }>;
  bodyWikilinks: string[];
};

function walkMarkdown(root: string): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry)) continue;
      const full = path.join(dir, entry);
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        stack.push(full);
      } else if (stat.isFile() && entry.endsWith(".md")) {
        out.push(full);
      }
    }
  }
  return out;
}

function coerceType(raw: unknown): NodeType | null {
  if (typeof raw !== "string") return null;
  return (NODE_TYPES as readonly string[]).includes(raw) ? (raw as NodeType) : null;
}

function coerceVisibility(raw: unknown): NodeVisibility {
  if (raw === "published" || raw === "draft" || raw === "gm-only") return raw;
  return "draft";
}

function parseRelatedArray(
  raw: unknown,
): Array<{ targetSlug: string; relType: string }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ targetSlug: string; relType: string }> = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const ref = (entry as { ref?: unknown }).ref;
    const rel = (entry as { rel?: unknown }).rel;
    if (typeof ref !== "string" || typeof rel !== "string") continue;
    const match = ref.match(/^\[\[([^\]|]+)(?:\|[^\]]+)?\]\]$/);
    const target = match ? match[1] : ref;
    out.push({ targetSlug: normalizeSlug(target), relType: rel });
  }
  return out;
}

function companionSlugFromFrontmatter(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  const base = path.basename(raw).replace(/\.md$/, "");
  return normalizeSlug(base);
}

function parseNodeFile(
  sourcePath: string,
  fileContent: string,
): ParsedNodeFile | { error: string } {
  const parsed = matter(fileContent);
  const fm = parsed.data as Record<string, unknown>;
  const type = coerceType(fm.type);
  if (!type) {
    return { error: `${sourcePath}: missing or unknown frontmatter 'type'` };
  }
  const rawName = typeof fm.name === "string" ? fm.name : null;
  const fallbackName = path.basename(sourcePath).replace(/\.md$/, "");
  const name = rawName ?? fallbackName;
  const slug = normalizeSlug(name);
  if (slug === "") {
    return { error: `${sourcePath}: could not derive slug from name '${name}'` };
  }
  const visibility = coerceVisibility(fm.visibility);
  const depthTier = typeof fm.depth_tier === "string" ? fm.depth_tier : null;
  const status = typeof fm.status === "string" ? fm.status : null;
  const body = parsed.content;
  const sections = splitSections(body);
  const companionSlug = companionSlugFromFrontmatter(fm.gm_companion);
  const explicitRelated = parseRelatedArray(fm.related);
  const bodyWikilinks = extractWikilinks(body).map((l) => l.slug);

  return {
    slug,
    type,
    name,
    visibility,
    depthTier,
    status,
    frontmatter: fm,
    bodyMd: body,
    companionSlug,
    sourcePath,
    sections,
    explicitRelated,
    bodyWikilinks,
  };
}

export async function importVault(
  db: LibSQLDatabase<typeof schema>,
  vaultPath: string,
  options: ImportOptions = {},
): Promise<ImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats = {
    nodesImported: 0,
    sectionsImported: 0,
    relationshipsImported: 0,
    lexiconTermsImported: 0,
  };

  const files = walkMarkdown(vaultPath);

  const nodeFiles: ParsedNodeFile[] = [];
  const lexiconFiles: string[] = [];

  for (const file of files) {
    const base = path.basename(file);
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch (e) {
      errors.push(`${file}: failed to read (${(e as Error).message})`);
      continue;
    }

    if (base === "LEXICON.md") {
      lexiconFiles.push(file);
      continue;
    }

    const parsed = parseNodeFile(file, content);
    if ("error" in parsed) {
      // Silently skip non-node files (world-overview, timeline, etc.) — they
      // hit the type check and aren't errors, just not importable as nodes.
      continue;
    }
    const visResult = validateNodeVisibility({
      visibility: parsed.visibility,
      bodyMd: parsed.bodyMd,
      sourcePath: parsed.sourcePath,
    });
    if (!visResult.ok) {
      errors.push(...visResult.errors);
      continue;
    }
    nodeFiles.push(parsed);
  }

  const bySlug = new Map<string, ParsedNodeFile>();
  const deduped: ParsedNodeFile[] = [];
  for (const node of nodeFiles) {
    const existing = bySlug.get(node.slug);
    if (existing) {
      warnings.push(
        `${node.sourcePath}: duplicate slug '${node.slug}' — already imported from ${existing.sourcePath}; skipping`,
      );
      continue;
    }
    bySlug.set(node.slug, node);
    deduped.push(node);
  }
  nodeFiles.length = 0;
  nodeFiles.push(...deduped);

  const validSlugs = new Set(nodeFiles.map((n) => n.slug));
  const lexiconTerms = lexiconFiles.flatMap((file) =>
    parseLexicon(readFileSync(file, "utf8")),
  );
  const lexiconSlugs = new Set(lexiconTerms.map((t) => t.slug));

  for (const node of nodeFiles) {
    for (const wl of node.bodyWikilinks) {
      if (!validSlugs.has(wl) && !lexiconSlugs.has(wl)) {
        warnings.push(
          `${node.sourcePath}: orphan wikilink '[[${wl}]]' — no matching node or lexicon term`,
        );
      }
    }
    if (node.companionSlug && !validSlugs.has(node.companionSlug)) {
      warnings.push(
        `${node.sourcePath}: gm_companion points to '${node.companionSlug}' but no such node was imported`,
      );
    }
  }

  await db.transaction(async (tx) => {
    await tx.run(sql`DELETE FROM node_themes`);
    await tx.run(sql`DELETE FROM themes`);
    await tx.run(sql`DELETE FROM node_sections`);
    await tx.run(sql`DELETE FROM relationships`);
    await tx.run(sql`DELETE FROM lexicon_terms`);
    await tx.run(sql`DELETE FROM nodes`);

    for (const node of nodeFiles) {
      const inserted = await tx
        .insert(schema.nodes)
        .values({
          slug: node.slug,
          type: node.type,
          name: node.name,
          visibility: node.visibility,
          depthTier: node.depthTier,
          status: node.status,
          frontmatter: JSON.stringify(node.frontmatter),
          bodyMd: node.bodyMd,
          companionSlug: node.companionSlug,
          sourcePath: node.sourcePath,
        })
        .returning({ id: schema.nodes.id });
      const nodeId = inserted[0].id;
      stats.nodesImported += 1;

      for (const section of node.sections) {
        await tx.insert(schema.nodeSections).values({
          nodeId,
          heading: section.heading,
          order: section.order,
          bodyMd: section.bodyMd,
        });
        stats.sectionsImported += 1;
      }
    }

    const seen = new Set<string>();
    const insertRel = async (
      from: string,
      to: string,
      relType: string,
      source: "explicit" | "inverse",
    ) => {
      const key = `${from}::${to}::${relType}`;
      if (seen.has(key)) return;
      seen.add(key);
      await tx.insert(schema.relationships).values({
        fromSlug: from,
        toSlug: to,
        relType,
        source,
      });
      stats.relationshipsImported += 1;
    };

    for (const node of nodeFiles) {
      for (const edge of node.explicitRelated) {
        await insertRel(node.slug, edge.targetSlug, edge.relType, "explicit");
      }
      // Body wikilinks to other nodes become MENTIONS edges
      for (const wl of node.bodyWikilinks) {
        if (validSlugs.has(wl) && wl !== node.slug) {
          await insertRel(node.slug, wl, "MENTIONS", "explicit");
        }
      }
    }

    // Derive inverses in a second walk so the base set is stable
    const baseEdges = Array.from(seen).map((k) => k.split("::") as [string, string, string]);
    for (const [from, to, relType] of baseEdges) {
      const inv = inverseOf(relType);
      if (!inv) continue;
      await insertRel(to, from, inv, "inverse");
    }

    for (const term of lexiconTerms) {
      await tx.insert(schema.lexiconTerms).values({
        slug: term.slug,
        term: term.term,
        aliases: JSON.stringify(term.aliases),
        domain: term.domain,
        definition: term.definition,
        usage: term.usage,
        notes: term.notes,
        relatedTerms: JSON.stringify(term.relatedTerms),
        tooltipEnabled: term.tooltipEnabled ? 1 : 0,
      });
      stats.lexiconTermsImported += 1;
    }
  });

  const budget = options.warningBudget ?? 10;
  if (warnings.length > budget) {
    errors.push(
      `warning budget exceeded (${warnings.length} warnings, budget ${budget})`,
    );
  }

  return { errors, warnings, stats };
}
