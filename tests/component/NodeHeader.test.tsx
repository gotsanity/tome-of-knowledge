import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { NodeHeader } from "@/app/components/NodeHeader";
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

  it("does not crash when type-specific fields are missing", () => {
    render(<NodeHeader node={makeNode({ type: "lore", name: "The Compact" })} />);
    expect(
      screen.getByRole("heading", { name: /The Compact/i }),
    ).toBeInTheDocument();
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
