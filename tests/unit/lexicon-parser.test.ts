import { describe, it, expect } from "vitest";
import { parseLexicon } from "@/lib/vault/lexicon-parser";

const SAMPLE = `---
name: fixture-lexicon
description: test
type: reference
---

# Fixture Lexicon

Prelude text that should be ignored.

---

## Mantle

**Domain:** World
**Aliases:** divine mantle, office
**Definition:** A physical object or site that contains authority.
**Usage:** Central to divine power discussion.
**Related:** Convocation, Balance
**Notes:** Eleven mantles total.

---

## Convocation

**Domain:** World
**Definition:** The event in which the gods abandoned their mantles.
**Related:** Mantle

---

## Revenant

**Domain:** World
**Aliases:** —
**Definition:** A soul bound back into a body by oath.
`;

describe("parseLexicon", () => {
  it("parses each ## heading as a term", () => {
    const terms = parseLexicon(SAMPLE);
    const names = terms.map((t) => t.term);
    expect(names).toEqual(["Mantle", "Convocation", "Revenant"]);
  });

  it("extracts domain, definition, usage, notes, related, aliases", () => {
    const terms = parseLexicon(SAMPLE);
    const mantle = terms[0];
    expect(mantle.domain).toBe("World");
    expect(mantle.definition).toContain("physical object");
    expect(mantle.usage).toContain("divine power");
    expect(mantle.notes).toContain("Eleven");
    expect(mantle.aliases).toEqual(["divine mantle", "office"]);
    expect(mantle.relatedTerms).toEqual(["Convocation", "Balance"]);
  });

  it("produces a kebab-case slug from the term name", () => {
    const terms = parseLexicon(SAMPLE);
    expect(terms[0].slug).toBe("mantle");
  });

  it("tolerates missing optional fields", () => {
    const terms = parseLexicon(SAMPLE);
    const convocation = terms[1];
    expect(convocation.usage).toBeNull();
    expect(convocation.notes).toBeNull();
    expect(convocation.aliases).toEqual([]);
  });

  it('treats the literal "—" aliases value as empty', () => {
    const terms = parseLexicon(SAMPLE);
    expect(terms[2].aliases).toEqual([]);
  });

  it("defaults tooltipEnabled to true", () => {
    const terms = parseLexicon(SAMPLE);
    expect(terms[0].tooltipEnabled).toBe(true);
  });

  it("returns an empty array for a body with no ## headings", () => {
    expect(parseLexicon("# Just a title\n\nNothing else.")).toEqual([]);
  });
});
