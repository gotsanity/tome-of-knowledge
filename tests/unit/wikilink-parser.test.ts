import { describe, it, expect } from "vitest";
import { extractWikilinks } from "@/lib/vault/wikilink-parser";

describe("extractWikilinks", () => {
  it("extracts a bare [[slug]]", () => {
    const links = extractWikilinks("See [[fort-ashby]] for details.");
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ slug: "fort-ashby", display: "fort-ashby" });
  });

  it("extracts [[Display Name]] and normalizes to a slug", () => {
    const links = extractWikilinks("See [[Fort Ashby]].");
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ slug: "fort-ashby", display: "Fort Ashby" });
  });

  it("extracts [[slug|display]] with pipe alias", () => {
    const links = extractWikilinks("The [[fort-ashby|garrison]] is old.");
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ slug: "fort-ashby", display: "garrison" });
  });

  it("ignores wikilinks inside fenced code blocks", () => {
    const md = `Regular [[outside]] link.

\`\`\`
Code [[inside]] block.
\`\`\`

More [[after]].`;
    const links = extractWikilinks(md);
    const slugs = links.map((l) => l.slug).sort();
    expect(slugs).toEqual(["after", "outside"]);
  });

  it("ignores wikilinks inside inline code spans", () => {
    const links = extractWikilinks("Use `[[not-a-link]]` literally, but [[real-link]] counts.");
    expect(links.map((l) => l.slug)).toEqual(["real-link"]);
  });

  it("returns span offsets for rewriters", () => {
    const md = "Hi [[fort-ashby]] there.";
    const links = extractWikilinks(md);
    expect(links[0].start).toBe(3);
    expect(links[0].end).toBe(17);
    expect(md.slice(links[0].start, links[0].end)).toBe("[[fort-ashby]]");
  });

  it("extracts multiple links in order", () => {
    const links = extractWikilinks("[[a]] then [[b]] then [[c]]");
    expect(links.map((l) => l.slug)).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array for a body with no links", () => {
    expect(extractWikilinks("no links here")).toEqual([]);
  });
});
