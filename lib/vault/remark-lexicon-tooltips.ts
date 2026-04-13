import { visit, SKIP } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Text, Link, Parent, Paragraph, PhrasingContent } from "mdast";

export type LexiconTooltipsOptions = {
  terms: ReadonlyArray<{
    slug: string;
    term: string;
    aliases: readonly string[];
    tooltipEnabled: boolean;
  }>;
};

type CompiledTerm = {
  slug: string;
  // Longest alias first so overlapping matches prefer the more specific form.
  patterns: string[];
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compile(options: LexiconTooltipsOptions): CompiledTerm[] {
  return options.terms
    .filter((t) => t.tooltipEnabled)
    .map((t) => {
      const all = [t.term, ...t.aliases];
      const patterns = all
        .slice()
        .sort((a, b) => b.length - a.length);
      return { slug: t.slug, patterns };
    });
}

function splitTextNode(
  node: Text,
  terms: CompiledTerm[],
  seenInParagraph: Set<string>,
): PhrasingContent[] | null {
  const value = node.value;
  const out: PhrasingContent[] = [];
  let cursor = 0;
  let madeChange = false;

  while (cursor < value.length) {
    let bestMatch: { slug: string; start: number; end: number; text: string } | null =
      null;

    for (const term of terms) {
      if (seenInParagraph.has(term.slug)) continue;
      for (const pattern of term.patterns) {
        const re = new RegExp(`\\b${escapeRegex(pattern)}\\b`, "i");
        const m = re.exec(value.slice(cursor));
        if (!m) continue;
        const absoluteStart = cursor + m.index;
        if (
          bestMatch === null ||
          absoluteStart < bestMatch.start ||
          (absoluteStart === bestMatch.start &&
            m[0].length > bestMatch.end - bestMatch.start)
        ) {
          bestMatch = {
            slug: term.slug,
            start: absoluteStart,
            end: absoluteStart + m[0].length,
            text: m[0],
          };
        }
        break; // Longest alias for this term already found; move on.
      }
    }

    if (!bestMatch) {
      if (cursor < value.length) {
        out.push({ type: "text", value: value.slice(cursor) });
      }
      break;
    }

    madeChange = true;
    if (bestMatch.start > cursor) {
      out.push({ type: "text", value: value.slice(cursor, bestMatch.start) });
    }
    const link: Link = {
      type: "link",
      url: `/lexicon/${bestMatch.slug}`,
      title: null,
      children: [{ type: "text", value: bestMatch.text }],
    };
    out.push(link);
    seenInParagraph.add(bestMatch.slug);
    cursor = bestMatch.end;
  }

  return madeChange ? out : null;
}

export const remarkLexiconTooltips: Plugin<[LexiconTooltipsOptions], Root> = (
  options,
) => {
  const terms = compile(options);
  if (terms.length === 0) {
    return () => {};
  }

  return (tree) => {
    visit(tree, "paragraph", (paragraph: Paragraph) => {
      const seen = new Set<string>();
      rewriteChildren(paragraph as Parent, terms, seen);
    });
  };
};

function rewriteChildren(
  parent: Parent,
  terms: CompiledTerm[],
  seen: Set<string>,
) {
  const children = parent.children as PhrasingContent[];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (
      child.type === "link" ||
      child.type === "linkReference" ||
      child.type === "inlineCode" ||
      (child as { type: string }).type === "code"
    ) {
      continue;
    }
    if (child.type === "text") {
      const replacement = splitTextNode(child, terms, seen);
      if (replacement) {
        children.splice(i, 1, ...replacement);
        i += replacement.length - 1;
      }
    } else if ("children" in child) {
      rewriteChildren(child as Parent, terms, seen);
    }
  }
}

// Re-export SKIP so the visit function's return type stays happy if extended.
void SKIP;
