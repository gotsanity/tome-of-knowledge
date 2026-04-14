import Link from "next/link";
import type { LoadedNode } from "@/lib/vault/loaders";
import {
  partitionRulesForViewer,
  type FieldRule,
} from "@/lib/vault/node-display-config";
import { CATEGORY_META } from "@/lib/vault/categories";
import type { NodeType } from "@/lib/db/schema";
import { parseFacetLink } from "./NodeHeader";

/**
 * Boxed "Marginalia" card in the node page sidebar. Renders label/value
 * rows for non-badge marginalia rules followed by a row of chips for
 * marginalia badges (status, visibility_state). Rows whose frontmatter
 * value is missing are skipped silently — it's normal for optional fields
 * to be absent.
 */
export function Marginalia({
  node,
  viewerIsGm,
  nodeSlugs,
}: {
  node: LoadedNode;
  viewerIsGm: boolean;
  nodeSlugs?: Set<string>;
}) {
  const { marginaliaRows, marginaliaBadges } = partitionRulesForViewer(
    node.type,
    viewerIsGm,
  );

  const rows = marginaliaRows
    .map((rule) => renderRow(rule, node, nodeSlugs))
    .filter((r): r is JSX.Element => r !== null);

  const badges = marginaliaBadges
    .map((rule) => renderBadge(rule, node))
    .filter((b): b is JSX.Element => b !== null);

  if (rows.length === 0 && badges.length === 0) return null;

  return (
    <aside
      className="bg-surface-container-high/40 backdrop-blur-sm border border-outline-variant/30 p-6 rounded shadow-sm shadow-background/60"
      aria-labelledby="marginalia-heading"
    >
      <h4
        id="marginalia-heading"
        className="text-[11px] font-black uppercase tracking-[0.25em] text-primary mb-6 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm" aria-hidden>
          info
        </span>
        Marginalia
      </h4>
      <div className="space-y-6">{rows}</div>
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-outline-variant/30">
          {badges}
        </div>
      )}
    </aside>
  );
}

function frontmatterValue(
  node: LoadedNode,
  key: string,
): string | string[] | null {
  // `type` and `visibility` live as top-level columns on LoadedNode,
  // populated by the importer from frontmatter. `status` is top-level too
  // but type-specific rules may override it (e.g. plotline.status reads
  // the frontmatter value directly), so we only fall back to the column
  // when the frontmatter key is absent.
  if (key === "type") return node.type;
  if (key === "name") return node.name;
  if (key === "visibility") return node.visibility;

  const fm = node.frontmatter[key];
  if (typeof fm === "string") return fm;
  if (typeof fm === "boolean") return fm ? "true" : "false";
  if (typeof fm === "number") return String(fm);
  if (Array.isArray(fm)) {
    const items = fm.filter((v): v is string => typeof v === "string");
    return items.length > 0 ? items : null;
  }
  if (key === "status" && typeof node.status === "string") return node.status;
  return null;
}

function renderRow(
  rule: FieldRule,
  node: LoadedNode,
  nodeSlugs?: Set<string>,
): JSX.Element | null {
  const raw = frontmatterValue(node, rule.key);
  if (raw === null) return null;

  // Universal type row — linked to its ToC category anchor.
  if (rule.key === "type") {
    const type = raw as NodeType;
    const meta = CATEGORY_META[type];
    const label = meta?.label ?? type;
    return (
      <div key={rule.key} className="flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-outline mb-1">
          {rule.label}
        </span>
        <Link
          href={`/contents#${type}`}
          className="text-sm text-primary hover:underline decoration-1 underline-offset-4"
        >
          {label}
        </Link>
      </div>
    );
  }

  const values = Array.isArray(raw) ? raw : [raw];

  return (
    <div key={rule.key} className="flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-outline mb-1">
        {rule.label}
      </span>
      <div className="text-sm text-on-surface-variant flex flex-wrap gap-x-2 gap-y-1">
        {values.map((v, i) => {
          if (rule.link) {
            const parsed = parseFacetLink(v, nodeSlugs);
            return parsed.href ? (
              <Link
                key={`${rule.key}-${i}`}
                href={parsed.href}
                className="text-primary hover:underline decoration-1 underline-offset-4"
              >
                {parsed.label}
              </Link>
            ) : (
              <span key={`${rule.key}-${i}`}>{parsed.label}</span>
            );
          }
          return <span key={`${rule.key}-${i}`}>{v}</span>;
        })}
      </div>
    </div>
  );
}

function renderBadge(rule: FieldRule, node: LoadedNode): JSX.Element | null {
  const raw = frontmatterValue(node, rule.key);
  if (raw === null) return null;
  const value = Array.isArray(raw) ? raw.join(", ") : raw;
  return (
    <span
      key={rule.key}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5 text-[10px] uppercase tracking-widest text-primary"
      title={rule.label}
    >
      <span className="text-outline">{rule.label}:</span>
      <span className="text-primary font-bold">{value}</span>
    </span>
  );
}
