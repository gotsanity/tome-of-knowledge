import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/lib/db/schema";
import { isGm, type Viewer } from "./can-see";
import { getNode, type LoadedSection } from "./loaders";

export type ScribeSubjectKind = "node" | "page";

/**
 * Normalized view of anything the Scribe desk can address. Nodes come from the
 * vault graph; pages are app-authored standalone articles. `origin` is the
 * forward hook for the future diff-export mechanism — vault-imported content
 * will route saves through a journal so the vault maintainer can reconcile,
 * while app-authored content will save directly.
 */
export type ScribeSubject = {
  kind: ScribeSubjectKind;
  slug: string;
  name: string;
  bodyMd: string;
  sections: LoadedSection[];
  frontmatter: Record<string, unknown>;
  origin: "vault" | "app";
  updatedAt: Date;
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

export async function loadScribeSubject(
  db: LibSQLDatabase<typeof schema>,
  kind: ScribeSubjectKind,
  slug: string,
  viewer: Viewer,
): Promise<ScribeSubject | null> {
  if (!isGm(viewer)) return null;

  if (kind === "node") {
    const node = await getNode(db, slug, viewer);
    if (!node) return null;
    const row = await db.query.nodes.findFirst({
      where: eq(schema.nodes.slug, slug),
    });
    return {
      kind: "node",
      slug: node.slug,
      name: node.name,
      bodyMd: node.bodyMd,
      sections: node.sections,
      frontmatter: node.frontmatter,
      origin: node.sourcePath.length > 0 ? "vault" : "app",
      updatedAt: row?.updatedAt ?? new Date(),
    };
  }

  const page = await db.query.pages.findFirst({
    where: eq(schema.pages.slug, slug),
  });
  if (!page) return null;
  return {
    kind: "page",
    slug: page.slug,
    name: page.title,
    bodyMd: page.bodyMd,
    sections: [],
    frontmatter: parseFrontmatter(page.frontmatter),
    origin: page.origin,
    updatedAt: page.updatedAt,
  };
}
