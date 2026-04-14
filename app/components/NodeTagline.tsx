import type { LoadedNode, LoadedLexiconTerm } from "@/lib/vault/loaders";

/**
 * Subtitle row rendered under a node page's H1. Uses the same visual
 * treatment as the /entry page's "Recovered from... · Circa..." row.
 *
 * Precedence:
 *   1. `event.summary` frontmatter (events carry their own tagline).
 *   2. Matching lexicon term's `definition` — matched first by slug, then
 *      by name against the lexicon term and its aliases.
 *   3. Nothing (renders null).
 */
export function resolveTagline(
  node: LoadedNode,
  lexicon: readonly Pick<LoadedLexiconTerm, "slug" | "term" | "aliases" | "definition">[],
): string | null {
  if (node.type === "event") {
    const summary = node.frontmatter.summary;
    if (typeof summary === "string" && summary.length > 0) return summary;
  }

  const bySlug = lexicon.find((t) => t.slug === node.slug);
  if (bySlug) return bySlug.definition;

  const lowerName = node.name.toLowerCase();
  const byName = lexicon.find((t) => {
    if (t.term.toLowerCase() === lowerName) return true;
    return t.aliases.some((alias) => alias.toLowerCase() === lowerName);
  });
  if (byName) return byName.definition;

  return null;
}

export function NodeTagline({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="flex items-center gap-4 text-on-surface-variant italic">
      <span>{text}</span>
    </div>
  );
}
