import { describe, it, expect } from "vitest";
import { CATEGORY_META } from "@/lib/vault/categories";
import { NODE_TYPES } from "@/lib/db/schema";

describe("CATEGORY_META", () => {
  it("has an entry for every NODE_TYPES value", () => {
    for (const type of NODE_TYPES) {
      const meta = CATEGORY_META[type];
      expect(meta).toBeDefined();
      expect(meta.type).toBe(type);
    }
  });

  it("every letter is 1–3 characters", () => {
    for (const type of NODE_TYPES) {
      const { letter } = CATEGORY_META[type];
      expect(letter.length).toBeGreaterThanOrEqual(1);
      expect(letter.length).toBeLessThanOrEqual(3);
    }
  });

  it("every letter is unique across the map", () => {
    const letters = NODE_TYPES.map((t) => CATEGORY_META[t].letter);
    const unique = new Set(letters);
    expect(unique.size).toBe(letters.length);
  });

  it("every blurb is non-empty and ≤ 80 chars", () => {
    for (const type of NODE_TYPES) {
      const { blurb } = CATEGORY_META[type];
      expect(blurb.length).toBeGreaterThan(0);
      expect(blurb.length).toBeLessThanOrEqual(80);
    }
  });

  it("every label is non-empty", () => {
    for (const type of NODE_TYPES) {
      expect(CATEGORY_META[type].label.length).toBeGreaterThan(0);
    }
  });
});
