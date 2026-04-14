import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { NodeHeader, parseFacetLink } from "@/app/components/NodeHeader";
import type { LoadedNode } from "@/lib/vault/loaders";

function makeNode(overrides: Partial<LoadedNode>): LoadedNode {
  return {
    id: "id",
    slug: "slug",
    type: "npc",
    name: "Default Name",
    visibility: "published",
    depthTier: null,
    status: null,
    frontmatter: {},
    bodyMd: "",
    companionSlug: null,
    sourcePath: "test.md",
    sections: [],
    ...overrides,
  };
}

/**
 * parseFacetLink remains a shared helper used by Marginalia for link-typed
 * frontmatter fields. Its behavior has not changed.
 */
describe("parseFacetLink", () => {
  const slugs = new Set(["order-of-mending", "fort-ashby"]);

  it("parses a bare wikilink with a resolving slug", () => {
    expect(parseFacetLink("[[order-of-mending]]", slugs)).toEqual({
      label: "order-of-mending",
      href: "/node/order-of-mending",
    });
  });

  it("parses a wikilink with a display label", () => {
    expect(parseFacetLink("[[fort-ashby|Fort Ashby]]", slugs)).toEqual({
      label: "Fort Ashby",
      href: "/node/fort-ashby",
    });
  });

  it("strips brackets even when the target is unknown", () => {
    expect(parseFacetLink("[[greystone-coalition]]", slugs)).toEqual({
      label: "greystone-coalition",
    });
  });

  it("links a bare slug when it resolves in the known set", () => {
    expect(parseFacetLink("order-of-mending", slugs)).toEqual({
      label: "order-of-mending",
      href: "/node/order-of-mending",
    });
  });

  it("returns freeform prose unchanged with no link", () => {
    expect(parseFacetLink("garrison commander", slugs)).toEqual({
      label: "garrison commander",
    });
  });
});

/**
 * After issue #14, NodeHeader only renders the eyebrow (type label) and
 * the H1 title. Frontmatter facets moved to the Marginalia sidebar card.
 */
describe("NodeHeader", () => {
  it("renders the eyebrow and title for an NPC", () => {
    render(
      <NodeHeader node={makeNode({ type: "npc", name: "Fort Commander" })} />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: /Fort Commander/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Figure$/)).toBeInTheDocument();
  });

  it("renders the expected eyebrow label for each of several node types", () => {
    const { rerender } = render(
      <NodeHeader node={makeNode({ type: "location", name: "Fort Ashby" })} />,
    );
    expect(screen.getByText("Place")).toBeInTheDocument();

    rerender(
      <NodeHeader
        node={makeNode({ type: "faction", name: "Order of Mending" })}
      />,
    );
    expect(screen.getByText("Faction")).toBeInTheDocument();

    rerender(<NodeHeader node={makeNode({ type: "event", name: "Fall" })} />);
    expect(screen.getByText("Event")).toBeInTheDocument();
  });

  it("humanizes a kebab-case name for display", () => {
    render(
      <NodeHeader node={makeNode({ type: "npc", name: "fort-commander" })} />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: /Fort Commander/i }),
    ).toBeInTheDocument();
  });

  it("leaves an already-humanized name alone", () => {
    render(
      <NodeHeader node={makeNode({ type: "npc", name: "Fort Commander" })} />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: /Fort Commander/i }),
    ).toBeInTheDocument();
  });

  it("does not render frontmatter facets — those belong to Marginalia now", () => {
    render(
      <NodeHeader
        node={makeNode({
          type: "npc",
          name: "Fort Commander",
          frontmatter: {
            species: "human",
            faction_affiliation: "order-of-mending",
            public_role: "garrison commander",
          },
        })}
      />,
    );
    expect(screen.queryByText(/human/i)).toBeNull();
    expect(screen.queryByText(/order-of-mending/i)).toBeNull();
    expect(screen.queryByText(/garrison commander/i)).toBeNull();
  });

  it("is accessible (axe)", async () => {
    const { container } = render(
      <NodeHeader node={makeNode({ type: "npc", name: "Fort Commander" })} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
