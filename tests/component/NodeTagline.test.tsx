import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { resolveTagline, NodeTagline } from "@/app/components/NodeTagline";
import type { LoadedNode } from "@/lib/vault/loaders";

function makeNode(overrides: Partial<LoadedNode> = {}): LoadedNode {
  return {
    id: "id-1",
    slug: "obsidian-vellum",
    type: "lore",
    name: "Obsidian Vellum",
    visibility: "published",
    depthTier: "detail",
    status: "active",
    frontmatter: {},
    bodyMd: "",
    companionSlug: null,
    sourcePath: "lore/obsidian-vellum.md",
    sections: [],
    ...overrides,
  };
}

describe("resolveTagline", () => {
  it("uses event.summary when type is event", () => {
    const tag = resolveTagline(
      makeNode({
        type: "event",
        frontmatter: { summary: "The tower fell in a single night." },
      }),
      [],
    );
    expect(tag).toBe("The tower fell in a single night.");
  });

  it("falls back to lexicon definition matched by slug", () => {
    const tag = resolveTagline(makeNode(), [
      {
        slug: "obsidian-vellum",
        term: "Obsidian Vellum",
        aliases: [],
        definition: "A vellum said to bleed gold.",
      },
    ]);
    expect(tag).toBe("A vellum said to bleed gold.");
  });

  it("falls back to lexicon definition matched by term name", () => {
    const tag = resolveTagline(
      makeNode({ slug: "different-slug" }),
      [
        {
          slug: "different-entry",
          term: "Obsidian Vellum",
          aliases: [],
          definition: "A vellum said to bleed gold.",
        },
      ],
    );
    expect(tag).toBe("A vellum said to bleed gold.");
  });

  it("falls back to lexicon definition matched via aliases", () => {
    const tag = resolveTagline(
      makeNode({ slug: "different-slug" }),
      [
        {
          slug: "vellum",
          term: "Vellum",
          aliases: ["Obsidian Vellum", "Black Vellum"],
          definition: "Darkened parchment of the void.",
        },
      ],
    );
    expect(tag).toBe("Darkened parchment of the void.");
  });

  it("returns null when nothing matches", () => {
    const tag = resolveTagline(makeNode({ slug: "lonely" }), []);
    expect(tag).toBeNull();
  });

  it("event summary wins over a matching lexicon entry", () => {
    const tag = resolveTagline(
      makeNode({
        type: "event",
        slug: "fall-of-the-tower",
        frontmatter: { summary: "One night, the tower fell." },
      }),
      [
        {
          slug: "fall-of-the-tower",
          term: "Fall of the Tower",
          aliases: [],
          definition: "A long lexicon definition.",
        },
      ],
    );
    expect(tag).toBe("One night, the tower fell.");
  });
});

describe("NodeTagline", () => {
  it("renders the text when provided", () => {
    render(<NodeTagline text="Recovered from the Silent Isles" />);
    expect(screen.getByText(/silent isles/i)).toBeTruthy();
  });

  it("renders nothing when text is null", () => {
    const { container } = render(<NodeTagline text={null} />);
    expect(container.firstChild).toBeNull();
  });
});
