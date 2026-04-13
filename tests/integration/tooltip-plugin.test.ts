import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import {
  remarkLexiconTooltips,
  type LexiconTooltipsOptions,
} from "@/lib/vault/remark-lexicon-tooltips";
import type { Root, Link, Paragraph } from "mdast";

function transformAst(input: string, options: LexiconTooltipsOptions): Root {
  const processor = unified()
    .use(remarkParse)
    .use(remarkLexiconTooltips, options);
  const tree = processor.parse(input) as Root;
  return processor.runSync(tree) as Root;
}

function findAllLinks(tree: Root): Link[] {
  const links: Link[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function walk(node: any) {
    if (node.type === "link") links.push(node);
    if (node.children) for (const c of node.children) walk(c);
  }
  walk(tree);
  return links;
}

const terms: LexiconTooltipsOptions = {
  terms: [
    {
      slug: "mantle",
      term: "Mantle",
      aliases: ["divine mantle", "office"],
      tooltipEnabled: true,
    },
    {
      slug: "revenant",
      term: "Revenant",
      aliases: [],
      tooltipEnabled: true,
    },
    {
      slug: "garrison",
      term: "Garrison",
      aliases: ["garrisons"],
      tooltipEnabled: false,
    },
    {
      slug: "convocation",
      term: "Convocation",
      aliases: ["The Convocation"],
      tooltipEnabled: true,
    },
  ],
};

describe("remarkLexiconTooltips", () => {
  it("wraps a matched term in a link to /lexicon/<slug>", () => {
    const tree = transformAst("The Mantle is central.", terms);
    const links = findAllLinks(tree);
    expect(links.length).toBe(1);
    expect(links[0].url).toBe("/lexicon/mantle");
  });

  it("matches an alias and routes to the canonical slug", () => {
    const tree = transformAst("The divine mantle demands much.", terms);
    const links = findAllLinks(tree);
    expect(links.length).toBe(1);
    expect(links[0].url).toBe("/lexicon/mantle");
  });

  it("is case-insensitive", () => {
    const tree = transformAst("the MANTLE is old.", terms);
    const links = findAllLinks(tree);
    expect(links.length).toBe(1);
  });

  it("matches with word boundaries (not inside larger words)", () => {
    const tree = transformAst("Mantlepiece is not a mantle.", terms);
    const links = findAllLinks(tree);
    // Only "mantle" at word boundary should match; "Mantlepiece" should not.
    expect(links.length).toBe(1);
  });

  it("only wraps the first occurrence of a term per paragraph", () => {
    const tree = transformAst("Mantle and mantle again.", terms);
    const paragraph = tree.children[0] as Paragraph;
    const links = paragraph.children.filter(
      (c): c is Link => c.type === "link",
    );
    expect(links.length).toBe(1);
  });

  it("wraps different terms in the same paragraph", () => {
    const tree = transformAst("A mantle holds a revenant.", terms);
    const links = findAllLinks(tree);
    expect(links.length).toBe(2);
  });

  it("skips terms with tooltipEnabled = false", () => {
    const tree = transformAst("The garrison awaits.", terms);
    const links = findAllLinks(tree);
    expect(links.length).toBe(0);
  });

  it("does not wrap terms inside existing links", () => {
    const tree = transformAst("[An existing mantle link](/elsewhere)", terms);
    const links = findAllLinks(tree);
    expect(links.length).toBe(1);
    expect(links[0].url).toBe("/elsewhere");
  });

  it("does not wrap terms inside inline code", () => {
    const tree = transformAst("Use `mantle` literally.", terms);
    const links = findAllLinks(tree);
    expect(links.length).toBe(0);
  });

  it("does not wrap terms inside headings", () => {
    const tree = transformAst("## The Mantle\n\nContent.", terms);
    const heading = tree.children[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const linksInHeading = (heading as any).children.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => c.type === "link",
    );
    expect(linksInHeading.length).toBe(0);
  });

  it("leaves paragraphs without matches unchanged", () => {
    const tree = transformAst("Some unrelated prose.", terms);
    const links = findAllLinks(tree);
    expect(links.length).toBe(0);
  });

  it("prefers the longer alias when overlapping (e.g. 'The Convocation' vs 'Convocation')", () => {
    const tree = transformAst("After The Convocation ended.", terms);
    const links = findAllLinks(tree);
    expect(links.length).toBe(1);
    expect((links[0].children[0] as { value: string }).value).toBe(
      "The Convocation",
    );
  });
});
