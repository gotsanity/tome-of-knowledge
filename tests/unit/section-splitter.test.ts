import { describe, it, expect } from "vitest";
import { splitSections } from "@/lib/vault/section-splitter";

describe("splitSections", () => {
  it("splits a body at `##` headings preserving order", () => {
    const body = `## Overview

First body.

## Appearance

Second body.

## Relationships

Third.
`;
    const sections = splitSections(body);
    expect(sections).toHaveLength(3);
    expect(sections[0]).toMatchObject({ heading: "Overview", order: 0 });
    expect(sections[0].bodyMd).toContain("First body.");
    expect(sections[1]).toMatchObject({ heading: "Appearance", order: 1 });
    expect(sections[2]).toMatchObject({ heading: "Relationships", order: 2 });
  });

  it("returns a single synthetic section for a body with no headings", () => {
    const body = "Just some prose with no headings.";
    const sections = splitSections(body);
    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe("");
    expect(sections[0].bodyMd).toBe("Just some prose with no headings.");
  });

  it("includes leading prose before the first heading as a preamble", () => {
    const body = `Some intro text.

## Overview

Body.
`;
    const sections = splitSections(body);
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe("");
    expect(sections[0].bodyMd.trim()).toBe("Some intro text.");
    expect(sections[1].heading).toBe("Overview");
  });

  it("ignores `###` and `#` headings for splitting", () => {
    const body = `## Overview

# Not a split

### Also not

## Next

Body.
`;
    const sections = splitSections(body);
    expect(sections).toHaveLength(2);
    expect(sections[0].bodyMd).toContain("# Not a split");
    expect(sections[0].bodyMd).toContain("### Also not");
  });

  it("handles an empty body", () => {
    expect(splitSections("")).toEqual([]);
  });
});
