import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { remarkWikilinks } from "@/lib/vault/remark-wikilinks";
import type { Root, Link, Paragraph, Text } from "mdast";

function process(input: string, options: Parameters<typeof remarkWikilinks>[0]) {
  return unified()
    .use(remarkParse)
    .use(remarkWikilinks, options)
    .use(remarkStringify)
    .processSync(input)
    .toString()
    .trim();
}

function ast(input: string, options: Parameters<typeof remarkWikilinks>[0]): Root {
  return unified().use(remarkParse).use(remarkWikilinks, options).parse(input) as Root;
}

function transformAst(
  input: string,
  options: Parameters<typeof remarkWikilinks>[0],
): Root {
  const processor = unified().use(remarkParse).use(remarkWikilinks, options);
  const tree = processor.parse(input) as Root;
  return processor.runSync(tree) as Root;
}

const nodeSlugs = new Set(["fort-ashby", "fort-commander"]);
const lexiconSlugs = new Set(["mantle", "convocation"]);

describe("remarkWikilinks", () => {
  it("rewrites a bare [[slug]] to an internal link", () => {
    const tree = transformAst("See [[fort-ashby]] for details.", {
      nodeSlugs,
      lexiconSlugs,
    });
    const paragraph = tree.children[0] as Paragraph;
    const link = paragraph.children.find((c) => c.type === "link") as
      | Link
      | undefined;
    expect(link).toBeDefined();
    expect(link!.url).toBe("/node/fort-ashby");
    expect((link!.children[0] as Text).value).toBe("fort-ashby");
  });

  it("routes a lexicon match to /lexicon/<slug>", () => {
    const tree = transformAst("The [[mantle]] is key.", {
      nodeSlugs,
      lexiconSlugs,
    });
    const paragraph = tree.children[0] as Paragraph;
    const link = paragraph.children.find((c) => c.type === "link") as
      | Link
      | undefined;
    expect(link!.url).toBe("/lexicon/mantle");
  });

  it("handles [[Display Name]] by normalizing to a slug but keeping the display", () => {
    const tree = transformAst("The [[Fort Ashby]] garrison.", {
      nodeSlugs,
      lexiconSlugs,
    });
    const paragraph = tree.children[0] as Paragraph;
    const link = paragraph.children.find((c) => c.type === "link") as
      | Link
      | undefined;
    expect(link!.url).toBe("/node/fort-ashby");
    expect((link!.children[0] as Text).value).toBe("Fort Ashby");
  });

  it("handles [[slug|alias]] with pipe separator", () => {
    const tree = transformAst("The [[fort-ashby|old garrison]] stands.", {
      nodeSlugs,
      lexiconSlugs,
    });
    const paragraph = tree.children[0] as Paragraph;
    const link = paragraph.children.find((c) => c.type === "link") as
      | Link
      | undefined;
    expect(link!.url).toBe("/node/fort-ashby");
    expect((link!.children[0] as Text).value).toBe("old garrison");
  });

  it("routes an unknown slug to /node/ (becomes a 404 naturally)", () => {
    const tree = transformAst("The [[unknown-place]] is lost.", {
      nodeSlugs,
      lexiconSlugs,
    });
    const paragraph = tree.children[0] as Paragraph;
    const link = paragraph.children.find((c) => c.type === "link") as
      | Link
      | undefined;
    expect(link!.url).toBe("/node/unknown-place");
  });

  it("does not rewrite wikilinks inside code spans", () => {
    const tree = transformAst("Use `[[fort-ashby]]` literally.", {
      nodeSlugs,
      lexiconSlugs,
    });
    const paragraph = tree.children[0] as Paragraph;
    const links = paragraph.children.filter((c) => c.type === "link");
    expect(links.length).toBe(0);
  });

  it("does not rewrite wikilinks inside fenced code blocks", () => {
    const tree = transformAst(
      "Regular [[fort-ashby]] text.\n\n```\nCode [[fort-ashby]] block.\n```",
      { nodeSlugs, lexiconSlugs },
    );
    // First paragraph: one link. Code block: untouched.
    const links: Link[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function walk(node: any) {
      if (node.type === "link") links.push(node);
      if (node.children) for (const c of node.children) walk(c);
    }
    walk(tree);
    expect(links.length).toBe(1);
  });

  it("handles multiple wikilinks in one paragraph", () => {
    const tree = transformAst("From [[fort-ashby]] to [[fort-commander]].", {
      nodeSlugs,
      lexiconSlugs,
    });
    const paragraph = tree.children[0] as Paragraph;
    const links = paragraph.children.filter(
      (c): c is Link => c.type === "link",
    );
    expect(links.length).toBe(2);
    expect(links[0].url).toBe("/node/fort-ashby");
    expect(links[1].url).toBe("/node/fort-commander");
  });

  it("leaves plain markdown alone when no wikilinks present", () => {
    const out = process("Just regular text.", { nodeSlugs, lexiconSlugs });
    expect(out).toBe("Just regular text.");
  });

  // Silence unused-import warnings for ast helper (kept for future debugging)
  void ast;
});
