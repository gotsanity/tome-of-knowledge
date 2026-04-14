import type { LoadedNode } from "@/lib/vault/loaders";
import {
  partitionRulesForViewer,
  type FieldRule,
} from "@/lib/vault/node-display-config";

/**
 * A Translator's-Note-style quote block for a single frontmatter field.
 * Public blocks render with an uppercase primary label and italic body.
 * GM-only blocks carry a "GM" chip to distinguish them visually — visibility
 * gating happens upstream in BlockStack / Marginalia so this component
 * never has to know the viewer role.
 */
export function NodeBlock({
  label,
  value,
  gmOnly,
}: {
  label: string;
  value: string | readonly string[];
  gmOnly?: boolean;
}) {
  const items = Array.isArray(value) ? value : [value];
  return (
    <div className="bg-primary/5 p-6 border-l-2 border-primary/30 italic text-on-surface-variant text-sm leading-relaxed">
      <div className="flex items-center gap-2 not-italic mb-2">
        <span className="font-bold text-primary text-xs uppercase tracking-widest">
          {label}
        </span>
        {gmOnly && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-[9px] uppercase tracking-widest text-primary font-bold"
            title="GM only"
          >
            GM<span className="sr-only"> only</span>
          </span>
        )}
      </div>
      {items.length === 1 ? (
        <p>{items[0]}</p>
      ) : (
        <ul className="list-disc pl-5 space-y-1 not-italic">
          {items.map((item, i) => (
            <li key={i} className="italic">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Renders the stack of blocks for a node. Public blocks render first in
 * their declared order, then a thin divider, then GM-only blocks (only
 * shown when `viewerIsGm`). Skips blocks whose frontmatter value is absent.
 */
export function BlockStack({
  node,
  viewerIsGm,
}: {
  node: LoadedNode;
  viewerIsGm: boolean;
}) {
  const { blocksPublic, blocksGm } = partitionRulesForViewer(
    node.type,
    viewerIsGm,
  );

  const publicNodes = blocksPublic
    .map((rule) => renderBlock(rule, node, false))
    .filter((b): b is JSX.Element => b !== null);
  const gmNodes = blocksGm
    .map((rule) => renderBlock(rule, node, true))
    .filter((b): b is JSX.Element => b !== null);

  if (publicNodes.length === 0 && gmNodes.length === 0) return null;

  return (
    <div className="space-y-4">
      {publicNodes}
      {gmNodes.length > 0 && publicNodes.length > 0 && (
        <div className="border-t border-outline-variant/30" aria-hidden />
      )}
      {gmNodes}
    </div>
  );
}

function renderBlock(
  rule: FieldRule,
  node: LoadedNode,
  gmOnly: boolean,
): JSX.Element | null {
  const raw = node.frontmatter[rule.key];
  if (raw === undefined || raw === null) return null;
  if (typeof raw === "string") {
    if (raw.length === 0) return null;
    return (
      <NodeBlock key={rule.key} label={rule.label} value={raw} gmOnly={gmOnly} />
    );
  }
  if (Array.isArray(raw)) {
    const items = raw.filter((v): v is string => typeof v === "string");
    if (items.length === 0) return null;
    return (
      <NodeBlock
        key={rule.key}
        label={rule.label}
        value={items}
        gmOnly={gmOnly}
      />
    );
  }
  return null;
}
