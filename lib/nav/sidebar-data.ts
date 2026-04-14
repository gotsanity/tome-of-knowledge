import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/lib/db/schema";
import { NODE_TYPES, type NodeType } from "@/lib/db/schema";
import { listNodesByType, type LoadedNode } from "@/lib/vault/loaders";
import { CATEGORY_META } from "@/lib/vault/categories";
import type { Viewer } from "@/lib/vault/can-see";

export type SidebarNode = {
  slug: string;
  displayName: string;
};

export type SidebarSection = {
  type: NodeType;
  label: string;
  count: number;
  nodes: SidebarNode[];
};

export function displayName(node: Pick<LoadedNode, "name">): string {
  const raw = node.name;
  if (/\s/.test(raw) || /[A-Z]/.test(raw)) return raw;
  return raw
    .split("-")
    .filter((s) => s.length > 0)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export async function loadSidebarSections(
  db: LibSQLDatabase<typeof schema>,
  viewer: Viewer,
): Promise<SidebarSection[]> {
  const raw = await Promise.all(
    NODE_TYPES.map(async (type) => {
      const nodes = await listNodesByType(db, type, viewer);
      return { type, nodes };
    }),
  );
  return raw
    .filter((s) => s.nodes.length > 0)
    .map((section) => ({
      type: section.type,
      label: CATEGORY_META[section.type].label,
      count: section.nodes.length,
      nodes: section.nodes
        .map((n) => ({ slug: n.slug, displayName: displayName(n) }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    }));
}
