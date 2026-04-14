import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  computeLinkedRecords,
  LinkedRecords,
  type LinkedRecordEntry,
} from "@/app/components/LinkedRecords";
import type { LoadedNode, RelatedNode } from "@/lib/vault/loaders";

function makeNode(overrides: Partial<LoadedNode> = {}): LoadedNode {
  return {
    id: "id-1",
    slug: "fort-commander",
    type: "npc",
    name: "fort-commander",
    visibility: "published",
    depthTier: "detail",
    status: "active",
    frontmatter: {},
    bodyMd: "",
    companionSlug: null,
    sourcePath: "npcs/fort-commander.md",
    sections: [],
    ...overrides,
  };
}

function rel(partial: Partial<RelatedNode>): RelatedNode {
  return {
    slug: "fort-ashby",
    name: "Fort Ashby",
    type: "location",
    visibility: "published",
    relType: "BASED_IN",
    direction: "outgoing",
    ...partial,
  };
}

describe("computeLinkedRecords", () => {
  it("humanizes relType labels from related[]", () => {
    const entries = computeLinkedRecords(
      makeNode(),
      [rel({ relType: "MEMBER_OF" })],
      new Map(),
      false,
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe("member of");
  });

  it("dedupes by slug — first-seen relationship wins", () => {
    const entries = computeLinkedRecords(
      makeNode(),
      [
        rel({ slug: "fort-ashby", relType: "BASED_IN" }),
        rel({ slug: "fort-ashby", relType: "LOCATED_IN" }),
      ],
      new Map(),
      false,
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe("based in");
  });

  it("layers event.actors as linked records with the fallback label", () => {
    const entries = computeLinkedRecords(
      makeNode({
        type: "event",
        frontmatter: {
          actors: ["[[fort-commander]]", "[[hidden-revenant]]"],
        },
      }),
      [],
      new Map([
        ["fort-commander", { slug: "fort-commander", name: "Fort Commander" }],
        [
          "hidden-revenant",
          { slug: "hidden-revenant", name: "The Hidden Revenant" },
        ],
      ]),
      false,
    );
    expect(entries.map((e) => e.slug)).toEqual([
      "fort-commander",
      "hidden-revenant",
    ]);
    expect(entries[0].kind).toBe("associated with");
    expect(entries[0].title).toBe("Fort Commander");
  });

  it("typed relationships override fallback labels when slugs overlap", () => {
    const entries = computeLinkedRecords(
      makeNode({
        type: "event",
        frontmatter: {
          actors: ["[[fort-commander]]"],
        },
      }),
      [
        rel({
          slug: "fort-commander",
          name: "Fort Commander",
          type: "npc",
          relType: "CAUSED_BY",
        }),
      ],
      new Map([
        ["fort-commander", { slug: "fort-commander", name: "Fort Commander" }],
      ]),
      false,
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe("caused by");
  });

  it("drops field-sourced wikilinks whose slug does not resolve", () => {
    const entries = computeLinkedRecords(
      makeNode({
        type: "event",
        frontmatter: {
          actors: ["[[ghost-node]]", "[[fort-ashby]]"],
        },
      }),
      [],
      new Map([["fort-ashby", { slug: "fort-ashby", name: "Fort Ashby" }]]),
      false,
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].slug).toBe("fort-ashby");
  });

  it("accepts bare slug strings in addition to wikilink syntax", () => {
    const entries = computeLinkedRecords(
      makeNode({
        type: "system",
        frontmatter: { who_controls: "order-of-mending" },
      }),
      [],
      new Map([
        [
          "order-of-mending",
          { slug: "order-of-mending", name: "Order of Mending" },
        ],
      ]),
      false,
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe("associated with");
    expect(entries[0].title).toBe("Order of Mending");
  });
});

describe("LinkedRecords", () => {
  it("renders nothing when entries is empty", () => {
    const { container } = render(<LinkedRecords entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders title, kind, and href per entry", () => {
    const entries: LinkedRecordEntry[] = [
      {
        slug: "fort-ashby",
        title: "Fort Ashby",
        kind: "based in",
        href: "/node/fort-ashby",
      },
    ];
    render(<LinkedRecords entries={entries} />);
    const link = screen.getByRole("link", { name: /fort ashby/i });
    expect(link.getAttribute("href")).toBe("/node/fort-ashby");
    expect(screen.getByText("based in")).toBeTruthy();
  });
});
