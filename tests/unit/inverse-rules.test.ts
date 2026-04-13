import { describe, it, expect } from "vitest";
import { inverseOf, isKnownRelationship, RELATIONSHIP_PAIRS } from "@/lib/vault/inverse-rules";

describe("inverseOf", () => {
  const table: Array<[string, string]> = [
    ["CONTAINS", "LOCATED_IN"],
    ["LOCATED_IN", "CONTAINS"],
    ["BORDERS", "BORDERS"],
    ["MEMBER_OF", "HAS_MEMBER"],
    ["HAS_MEMBER", "MEMBER_OF"],
    ["BASED_IN", "HOUSES"],
    ["HOUSES", "BASED_IN"],
    ["OPERATES_IN", "HOSTS"],
    ["HOSTS", "OPERATES_IN"],
    ["FEATURES", "FEATURED_IN"],
    ["FEATURED_IN", "FEATURES"],
    ["GOVERNS", "GOVERNED_BY"],
    ["GOVERNED_BY", "GOVERNS"],
    ["DESCRIBES", "DESCRIBED_BY"],
    ["DESCRIBED_BY", "DESCRIBES"],
    ["ASSOCIATED_WITH", "ASSOCIATED_WITH"],
    ["SYNTHESIZES_FROM", "SOURCE_OF"],
    ["SOURCE_OF", "SYNTHESIZES_FROM"],
    ["CONTROLS", "CONTROLLED_BY"],
    ["CONTROLLED_BY", "CONTROLS"],
    ["CONTRACTS", "CONTRACTED_BY"],
    ["CONTRACTED_BY", "CONTRACTS"],
    ["OCCURRED_IN", "HAS_EVENT"],
    ["HAS_EVENT", "OCCURRED_IN"],
    ["DEPENDS_ON", "DEPENDENCY_OF"],
    ["DEPENDENCY_OF", "DEPENDS_ON"],
    ["ADVANCES", "ADVANCED_BY"],
    ["ADVANCED_BY", "ADVANCES"],
    ["FEATURES_IN", "FEATURED_BY"],
    ["FEATURED_BY", "FEATURES_IN"],
  ];

  it.each(table)("%s ↔ %s", (forward, inverse) => {
    expect(inverseOf(forward)).toBe(inverse);
  });

  it("returns null for unknown relationship types", () => {
    expect(inverseOf("PATRON_OF")).toBeNull();
    expect(inverseOf("")).toBeNull();
  });

  it("is case-sensitive to canonical UPPER_SNAKE names", () => {
    expect(inverseOf("contains")).toBeNull();
  });

  it("exposes the canonical pair list with 16 entries", () => {
    expect(RELATIONSHIP_PAIRS.length).toBeGreaterThanOrEqual(16);
  });
});

describe("isKnownRelationship", () => {
  it("accepts canonical forward and inverse names", () => {
    expect(isKnownRelationship("CONTAINS")).toBe(true);
    expect(isKnownRelationship("LOCATED_IN")).toBe(true);
    expect(isKnownRelationship("BORDERS")).toBe(true);
  });

  it("rejects unknown types", () => {
    expect(isKnownRelationship("PATRON_OF")).toBe(false);
  });
});
