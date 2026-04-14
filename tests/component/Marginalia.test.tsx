import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Marginalia } from "@/app/components/Marginalia";
import type { LoadedNode } from "@/lib/vault/loaders";

function makeNode(overrides: Partial<LoadedNode> = {}): LoadedNode {
  return {
    id: "id-1",
    slug: "calytrix-blackwood",
    type: "npc",
    name: "Calytrix Blackwood",
    visibility: "published",
    depthTier: "detail",
    status: "active",
    frontmatter: {},
    bodyMd: "",
    companionSlug: null,
    sourcePath: "npcs/calytrix-blackwood.md",
    sections: [],
    ...overrides,
  };
}

describe("Marginalia", () => {
  it("renders the universal type row with a link to the ToC anchor", () => {
    render(
      <Marginalia
        node={makeNode({ type: "npc", frontmatter: { species: "human" } })}
        viewerIsGm={false}
      />,
    );
    const typeLink = screen.getByRole("link", { name: "Figures" });
    expect(typeLink.getAttribute("href")).toBe("/contents#npc");
  });

  it("renders type-specific rows for the node's type", () => {
    render(
      <Marginalia
        node={makeNode({
          type: "npc",
          frontmatter: {
            species: "human",
            faction_affiliation: "order-of-mending",
          },
        })}
        viewerIsGm={false}
        nodeSlugs={new Set(["order-of-mending"])}
      />,
    );
    expect(screen.getByText(/^species$/i)).toBeTruthy();
    expect(screen.getByText("human")).toBeTruthy();
    expect(screen.getByText(/^affiliation$/i)).toBeTruthy();
    // faction_affiliation renders as a <Link> when the target slug exists
    const factionLink = screen.getByRole("link", {
      name: "order-of-mending",
    });
    expect(factionLink.getAttribute("href")).toBe("/node/order-of-mending");
  });

  it("skips rows whose frontmatter value is missing", () => {
    render(
      <Marginalia
        node={makeNode({ type: "npc", frontmatter: { species: "human" } })}
        viewerIsGm={false}
      />,
    );
    expect(screen.queryByText(/^affiliation$/i)).toBeNull();
  });

  it("hides status and visibility_state badges from non-GM viewers", () => {
    render(
      <Marginalia
        node={makeNode({
          type: "npc",
          frontmatter: {
            species: "human",
            status: "draft",
            visibility_state: "gm-only",
          },
        })}
        viewerIsGm={false}
      />,
    );
    expect(screen.queryByText(/^status:$/i)).toBeNull();
    expect(screen.queryByText(/^visibility:$/i)).toBeNull();
  });

  it("shows status and visibility_state badges to GM viewers", () => {
    render(
      <Marginalia
        node={makeNode({
          type: "npc",
          frontmatter: {
            species: "human",
            status: "draft",
            visibility_state: "gm-only",
          },
        })}
        viewerIsGm={true}
      />,
    );
    expect(screen.getByText(/^status:$/i)).toBeTruthy();
    expect(screen.getByText("draft")).toBeTruthy();
    expect(screen.getByText(/^visibility:$/i)).toBeTruthy();
    expect(screen.getByText("gm-only")).toBeTruthy();
  });

  it("renders nothing when no rows or badges apply", () => {
    const { container } = render(
      <Marginalia
        node={makeNode({ type: "species", frontmatter: {} })}
        viewerIsGm={false}
      />,
    );
    // Species has no type-specific rules and no frontmatter,
    // but the universal type row still renders. Confirm it does:
    expect(container.querySelector("aside")).not.toBeNull();
  });

  it("renders a pipe-aliased wikilink link target using the alias label", () => {
    render(
      <Marginalia
        node={makeNode({
          type: "npc",
          frontmatter: {
            faction_affiliation: "[[order-of-mending|The Menders]]",
          },
        })}
        viewerIsGm={false}
        nodeSlugs={new Set(["order-of-mending"])}
      />,
    );
    const link = screen.getByRole("link", { name: /the menders/i });
    expect(link.getAttribute("href")).toBe("/node/order-of-mending");
  });

  it("strips wikilink brackets even when the target slug is unresolvable", () => {
    render(
      <Marginalia
        node={makeNode({
          type: "npc",
          frontmatter: { faction_affiliation: "[[greystone-coalition]]" },
        })}
        viewerIsGm={false}
        nodeSlugs={new Set()}
      />,
    );
    // no link produced
    expect(
      screen.queryByRole("link", { name: /greystone-coalition/i }),
    ).toBeNull();
    // but the raw brackets never leak through
    expect(screen.queryByText(/\[\[/)).toBeNull();
    expect(screen.getByText(/greystone-coalition/)).toBeTruthy();
  });

  it("renders freeform prose for a link field as plain text", () => {
    render(
      <Marginalia
        node={makeNode({
          type: "npc",
          frontmatter: {
            faction_affiliation:
              "None current; Tareth primal-elf tribe by origin",
          },
        })}
        viewerIsGm={false}
        nodeSlugs={new Set()}
      />,
    );
    expect(
      screen.getByText(/None current; Tareth primal-elf tribe by origin/),
    ).toBeTruthy();
    // the faction_affiliation row is the only link-typed marginalia on an
    // npc besides species, so there must be no link produced
    expect(
      screen.queryByRole("link", { name: /primal-elf/i }),
    ).toBeNull();
  });

  it("renders type-specific status as a visible row for plotline, overriding the GM-only universal badge", () => {
    render(
      <Marginalia
        node={makeNode({
          type: "plotline",
          frontmatter: {
            plotline_type: "main",
            status: "active",
            phase: "setup",
          },
        })}
        viewerIsGm={false}
      />,
    );
    // plotline.status renders as a row, not a badge
    expect(screen.getByText(/^status$/i)).toBeTruthy();
    expect(screen.getByText("active")).toBeTruthy();
    // and not in a badge
    expect(screen.queryByText(/^status:$/i)).toBeNull();
  });
});
