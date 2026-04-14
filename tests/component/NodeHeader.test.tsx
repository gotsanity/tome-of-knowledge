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

describe("NodeHeader", () => {
  it("renders an NPC with species and faction affiliation", () => {
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
    expect(
      screen.getByRole("heading", { name: /Fort Commander/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/human/i)).toBeInTheDocument();
    expect(screen.getByText(/order-of-mending/i)).toBeInTheDocument();
  });

  it("renders a location with function and influence", () => {
    render(
      <NodeHeader
        node={makeNode({
          type: "location",
          name: "Fort Ashby",
          frontmatter: { function: "garrison", influence: "regional" },
        })}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /Fort Ashby/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/garrison/i)).toBeInTheDocument();
    expect(screen.getByText(/regional/i)).toBeInTheDocument();
  });

  it("renders a faction with goal", () => {
    render(
      <NodeHeader
        node={makeNode({
          type: "faction",
          name: "Order of Mending",
          frontmatter: { goal: "preserve the old oaths" },
        })}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /Order of Mending/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/preserve the old oaths/i)).toBeInTheDocument();
  });

  it("humanizes a kebab-case name for display", () => {
    render(
      <NodeHeader
        node={makeNode({
          type: "npc",
          name: "fort-commander",
        })}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /Fort Commander/i }),
    ).toBeInTheDocument();
  });

  it("leaves an already-humanized name alone", () => {
    render(<NodeHeader node={makeNode({ type: "npc", name: "Fort Commander" })} />);
    expect(
      screen.getByRole("heading", { name: /Fort Commander/i }),
    ).toBeInTheDocument();
  });

  it("does not crash when type-specific fields are missing", () => {
    render(<NodeHeader node={makeNode({ type: "lore", name: "The Compact" })} />);
    expect(
      screen.getByRole("heading", { name: /The Compact/i }),
    ).toBeInTheDocument();
  });

  it("renders a wikilink affiliation as a link to the affiliated node", () => {
    render(
      <NodeHeader
        node={makeNode({
          type: "npc",
          name: "Fort Commander",
          frontmatter: {
            faction_affiliation: "[[order-of-mending]]",
          },
        })}
        nodeSlugs={new Set(["order-of-mending"])}
      />,
    );
    const link = screen.getByRole("link", { name: /order-of-mending/i });
    expect(link).toHaveAttribute("href", "/node/order-of-mending");
    // raw brackets must never leak into the rendered output
    expect(screen.queryByText(/\[\[/)).toBeNull();
  });

  it("uses the pipe label when the wikilink is aliased", () => {
    render(
      <NodeHeader
        node={makeNode({
          type: "npc",
          name: "Test",
          frontmatter: {
            faction_affiliation: "[[order-of-mending|The Menders]]",
          },
        })}
        nodeSlugs={new Set(["order-of-mending"])}
      />,
    );
    expect(
      screen.getByRole("link", { name: /the menders/i }),
    ).toHaveAttribute("href", "/node/order-of-mending");
  });

  it("links bare-slug affiliations that resolve to a known node", () => {
    render(
      <NodeHeader
        node={makeNode({
          type: "npc",
          name: "Test",
          frontmatter: { faction_affiliation: "order-of-mending" },
        })}
        nodeSlugs={new Set(["order-of-mending"])}
      />,
    );
    expect(
      screen.getByRole("link", { name: /order-of-mending/i }),
    ).toHaveAttribute("href", "/node/order-of-mending");
  });

  it("strips wikilink brackets even when the slug is not resolvable", () => {
    render(
      <NodeHeader
        node={makeNode({
          type: "npc",
          name: "Test",
          frontmatter: {
            faction_affiliation: "[[greystone-coalition]]",
          },
        })}
        nodeSlugs={new Set()}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(/greystone-coalition/)).toBeInTheDocument();
    expect(screen.queryByText(/\[\[/)).toBeNull();
  });

  it("leaves freeform prose as plain text", () => {
    render(
      <NodeHeader
        node={makeNode({
          type: "npc",
          name: "Zhar",
          frontmatter: {
            faction_affiliation:
              "None current; Tareth primal-elf tribe by origin",
          },
        })}
        nodeSlugs={new Set()}
      />,
    );
    expect(
      screen.getByText(/None current; Tareth primal-elf tribe by origin/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("also linkifies non-affiliation facets like species when given a wikilink", () => {
    render(
      <NodeHeader
        node={makeNode({
          type: "npc",
          name: "Test",
          frontmatter: { species: "[[fort-ashby|Fort Ashby]]" },
        })}
        nodeSlugs={new Set(["fort-ashby"])}
      />,
    );
    expect(
      screen.getByRole("link", { name: /fort ashby/i }),
    ).toHaveAttribute("href", "/node/fort-ashby");
  });

  it("is accessible (axe)", async () => {
    const { container } = render(
      <NodeHeader
        node={makeNode({
          type: "npc",
          name: "Fort Commander",
          frontmatter: { species: "human" },
        })}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
