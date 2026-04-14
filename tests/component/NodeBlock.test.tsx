import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NodeBlock, BlockStack } from "@/app/components/NodeBlock";
import type { LoadedNode } from "@/lib/vault/loaders";

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

describe("NodeBlock", () => {
  it("renders label and value", () => {
    render(<NodeBlock label="Influence" value="Watches the eastern gate." />);
    expect(screen.getByText(/^influence$/i)).toBeTruthy();
    expect(screen.getByText("Watches the eastern gate.")).toBeTruthy();
  });

  it("does not render a GM chip for public blocks", () => {
    render(<NodeBlock label="Influence" value="Some influence" />);
    expect(screen.queryByTitle("GM only")).toBeNull();
  });

  it("renders a GM chip when gmOnly", () => {
    render(
      <NodeBlock label="Motivation" value="Hide the truth" gmOnly />,
    );
    expect(screen.getByTitle("GM only")).toBeTruthy();
  });

  it("renders list values as a bulleted list", () => {
    render(<NodeBlock label="Themes" value={["fate", "decay", "ambition"]} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});

describe("BlockStack", () => {
  it("renders public blocks in declared order", () => {
    render(
      <BlockStack
        node={makeNode({
          frontmatter: {
            public_role: "garrison commander",
            influence: "eastern gate",
          },
        })}
        viewerIsGm={false}
      />,
    );
    // npc declares public_role before influence
    const labels = screen.getAllByText(/public role|influence/i);
    expect(labels[0].textContent?.toLowerCase()).toContain("public role");
    expect(labels[1].textContent?.toLowerCase()).toContain("influence");
  });

  it("hides GM-only blocks from public viewers", () => {
    render(
      <BlockStack
        node={makeNode({
          frontmatter: {
            public_role: "garrison commander",
            motivation: "hidden truth",
            weak_point: "a lost oath",
          },
        })}
        viewerIsGm={false}
      />,
    );
    expect(screen.queryByText(/^motivation$/i)).toBeNull();
    expect(screen.queryByText(/^weak point$/i)).toBeNull();
    expect(screen.getByText(/^public role$/i)).toBeTruthy();
  });

  it("shows GM-only blocks to GM viewers with a chip", () => {
    render(
      <BlockStack
        node={makeNode({
          frontmatter: {
            public_role: "garrison commander",
            motivation: "hidden truth",
          },
        })}
        viewerIsGm={true}
      />,
    );
    expect(screen.getByText(/^motivation$/i)).toBeTruthy();
    expect(screen.getByTitle("GM only")).toBeTruthy();
  });

  it("renders nothing when no blocks apply", () => {
    const { container } = render(
      <BlockStack
        node={makeNode({ frontmatter: {} })}
        viewerIsGm={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("skips blocks whose frontmatter value is empty string", () => {
    render(
      <BlockStack
        node={makeNode({ frontmatter: { public_role: "", influence: "keeper" } })}
        viewerIsGm={false}
      />,
    );
    expect(screen.queryByText(/^public role$/i)).toBeNull();
    expect(screen.getByText(/^influence$/i)).toBeTruthy();
  });
});
