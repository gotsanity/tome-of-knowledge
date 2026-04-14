import Link from "next/link";
import type { LoadedNode, RelatedNode } from "@/lib/vault/loaders";
import {
  partitionRulesForViewer,
  LINKED_RECORDS_FALLBACK_LABEL,
} from "@/lib/vault/node-display-config";

export type LinkedRecordEntry = {
  slug: string;
  title: string;
  kind: string;
  href: string;
};

type NodeMeta = { slug: string; name: string };

/**
 * Build the ordered, deduplicated list of linked records for a node. The
 * pipeline:
 *   1. Seed from `related[]` (typed graph relationships).
 *   2. Layer on field-sourced wikilinks from `linked-records` display-config
 *      rules (event.actors, geography.boundaries, etc.) using the fallback
 *      "Associated with" label.
 *   3. Dedupe by target slug — the first-seen entry wins, so typed
 *      relationships always beat the fallback label.
 *
 * Field values are resolved to a human title via `nodeMetaBySlug`. Entries
 * whose slug doesn't resolve to a known node are dropped (dead wikilinks).
 */
export function computeLinkedRecords(
  node: LoadedNode,
  related: readonly RelatedNode[],
  nodeMetaBySlug: ReadonlyMap<string, NodeMeta>,
  viewerIsGm: boolean,
): LinkedRecordEntry[] {
  const out: LinkedRecordEntry[] = [];
  const seen = new Set<string>();

  for (const edge of related) {
    if (seen.has(edge.slug)) continue;
    seen.add(edge.slug);
    out.push({
      slug: edge.slug,
      title: edge.name,
      kind: edge.relType.replace(/_/g, " ").toLowerCase(),
      href: `/node/${edge.slug}`,
    });
  }

  const { linkedRecords } = partitionRulesForViewer(node.type, viewerIsGm);
  for (const rule of linkedRecords) {
    const raw = node.frontmatter[rule.key];
    const values: string[] = [];
    if (typeof raw === "string") values.push(raw);
    else if (Array.isArray(raw)) {
      for (const v of raw) if (typeof v === "string") values.push(v);
    }
    for (const v of values) {
      const slug = extractSlug(v);
      if (!slug) continue;
      if (seen.has(slug)) continue;
      const meta = nodeMetaBySlug.get(slug);
      if (!meta) continue;
      seen.add(slug);
      out.push({
        slug,
        title: meta.name,
        kind: LINKED_RECORDS_FALLBACK_LABEL.toLowerCase(),
        href: `/node/${slug}`,
      });
    }
  }

  return out;
}

/**
 * Parse a frontmatter value into the target slug for lookup. Accepts both
 * `[[slug]]` / `[[slug|label]]` wikilinks and bare slug strings.
 */
function extractSlug(raw: string): string | null {
  const trimmed = raw.trim();
  const wikilink = trimmed.match(/^\[\[([^\]|]+)(?:\|[^\]]+)?\]\]$/);
  if (wikilink) return wikilink[1].trim();
  if (/^[a-z0-9][a-z0-9-]*$/.test(trimmed)) return trimmed;
  return null;
}

/**
 * Sidebar list styled to match the entry page's "Linked Records" panel:
 * icon + title + small relationship label below. Renders nothing when the
 * entries list is empty.
 */
export function LinkedRecords({
  entries,
}: {
  entries: readonly LinkedRecordEntry[];
}) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-outline">
        Linked Records
      </h4>
      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.slug} className="group">
            <Link
              href={entry.href}
              className="flex items-start gap-3 cursor-pointer"
            >
              <span
                className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors"
                aria-hidden
              >
                description
              </span>
              <div>
                <p className="text-sm text-on-surface group-hover:text-primary transition-colors">
                  {entry.title}
                </p>
                <p className="text-[10px] text-outline uppercase tracking-tighter">
                  {entry.kind}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
