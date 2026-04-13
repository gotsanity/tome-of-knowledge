import { describe, it, expect } from "vitest";
import { normalizeSlug } from "@/lib/vault/slug";

describe("normalizeSlug", () => {
  it("kebab-cases a spaced display name", () => {
    expect(normalizeSlug("Fort Ashby")).toBe("fort-ashby");
  });

  it("is idempotent on already-kebab input", () => {
    expect(normalizeSlug("fort-ashby")).toBe("fort-ashby");
  });

  it("strips diacritics", () => {
    expect(normalizeSlug("Cafétaría")).toBe("cafetaria");
  });

  it("collapses runs of punctuation and whitespace", () => {
    expect(normalizeSlug("Fort   Ashby!!")).toBe("fort-ashby");
    expect(normalizeSlug("Fort__Ashby")).toBe("fort-ashby");
    expect(normalizeSlug("Fort/Ashby")).toBe("fort-ashby");
  });

  it("trims leading and trailing separators", () => {
    expect(normalizeSlug("-fort-ashby-")).toBe("fort-ashby");
    expect(normalizeSlug("  Fort Ashby  ")).toBe("fort-ashby");
  });

  it("handles empty and punctuation-only strings", () => {
    expect(normalizeSlug("")).toBe("");
    expect(normalizeSlug("!!!")).toBe("");
  });

  it("lowercases ASCII letters", () => {
    expect(normalizeSlug("FORT ASHBY")).toBe("fort-ashby");
  });

  it("preserves numbers", () => {
    expect(normalizeSlug("Fort Ashby 2")).toBe("fort-ashby-2");
  });
});
