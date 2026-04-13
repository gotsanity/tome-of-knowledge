import { describe, it, expect } from "vitest";
import { validateNodeVisibility, FORBIDDEN_PUBLISHED_HEADINGS } from "@/lib/vault/visibility";

describe("validateNodeVisibility", () => {
  it("accepts a published node with no forbidden headings", () => {
    const result = validateNodeVisibility({
      visibility: "published",
      bodyMd: "## Overview\n\nSome text.\n\n## Appearance\n\nMore.",
      sourcePath: "world/npcs/ok.md",
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it.each(FORBIDDEN_PUBLISHED_HEADINGS)(
    "rejects a published node containing `%s`",
    (heading) => {
      const result = validateNodeVisibility({
        visibility: "published",
        bodyMd: `## Overview\n\nok.\n\n${heading}\n\nleaked.`,
        sourcePath: "world/npcs/leaky.md",
      });
      expect(result.ok).toBe(false);
      expect(result.errors.join(" ")).toContain(heading);
    },
  );

  it("allows forbidden headings on a gm-only node", () => {
    const result = validateNodeVisibility({
      visibility: "gm-only",
      bodyMd: "## Secrets\n\nAll the secrets.",
      sourcePath: "world/npcs/gm.md",
    });
    expect(result.ok).toBe(true);
  });

  it("allows forbidden headings on a draft node", () => {
    const result = validateNodeVisibility({
      visibility: "draft",
      bodyMd: "## Hooks\n\nPlayer hooks.",
      sourcePath: "world/npcs/draft.md",
    });
    expect(result.ok).toBe(true);
  });

  it("is case-insensitive on heading comparison", () => {
    const result = validateNodeVisibility({
      visibility: "published",
      bodyMd: "## secrets\n\nstill a leak",
      sourcePath: "p.md",
    });
    expect(result.ok).toBe(false);
  });

  it("only matches `##` level headings, not deeper", () => {
    const result = validateNodeVisibility({
      visibility: "published",
      bodyMd: "### Secrets\n\nThird-level is fine.",
      sourcePath: "p.md",
    });
    expect(result.ok).toBe(true);
  });
});
