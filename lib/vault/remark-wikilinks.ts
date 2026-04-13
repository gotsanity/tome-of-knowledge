import { visit, SKIP } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Text, Link, Parent, PhrasingContent } from "mdast";
import { normalizeSlug } from "./slug";

export type WikilinksOptions = {
  nodeSlugs: ReadonlySet<string>;
  lexiconSlugs: ReadonlySet<string>;
};

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

function splitTextNode(
  node: Text,
  options: WikilinksOptions,
): PhrasingContent[] | null {
  const value = node.value;
  const out: PhrasingContent[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  WIKILINK_RE.lastIndex = 0;
  let found = false;

  while ((match = WIKILINK_RE.exec(value)) !== null) {
    found = true;
    const matchStart = match.index;
    const matchEnd = match.index + match[0].length;

    if (matchStart > lastIndex) {
      out.push({ type: "text", value: value.slice(lastIndex, matchStart) });
    }

    const target = match[1];
    const display = match[2] ?? target;
    const slug = normalizeSlug(target);
    if (slug === "") {
      out.push({ type: "text", value: match[0] });
      lastIndex = matchEnd;
      continue;
    }
    const url = options.lexiconSlugs.has(slug)
      ? `/lexicon/${slug}`
      : `/node/${slug}`;

    const link: Link = {
      type: "link",
      url,
      title: null,
      children: [{ type: "text", value: display }],
    };
    out.push(link);

    lastIndex = matchEnd;
  }

  if (!found) return null;

  if (lastIndex < value.length) {
    out.push({ type: "text", value: value.slice(lastIndex) });
  }

  return out;
}

export const remarkWikilinks: Plugin<[WikilinksOptions], Root> = (options) => {
  return (tree) => {
    visit(
      tree,
      "text",
      (node: Text, index: number | undefined, parent: Parent | undefined) => {
        if (
          !parent ||
          index === undefined ||
          parent.type === "inlineCode" ||
          parent.type === "code"
        ) {
          return;
        }
        const replacement = splitTextNode(node, options);
        if (!replacement) return;
        (parent.children as PhrasingContent[]).splice(index, 1, ...replacement);
        return [SKIP, index + replacement.length];
      },
    );
  };
};
