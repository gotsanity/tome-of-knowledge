import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NodeBody } from "@/app/components/NodeBody";

const emptyDeps = {
  wikilinks: { nodeSlugs: new Set<string>(), lexiconSlugs: new Set<string>() },
  lexiconTooltips: { terms: [] },
} as const;

describe("NodeBody styling upgrades", () => {
  it("applies drop-cap class to the article when there are no sections", () => {
    const { container } = render(
      <NodeBody
        sections={[]}
        bodyMd={"First paragraph of the manuscript.\n\nSecond paragraph."}
        wikilinks={emptyDeps.wikilinks}
        lexiconTooltips={emptyDeps.lexiconTooltips}
      />,
    );
    const article = container.querySelector("article");
    expect(article?.className).toContain("prose-manuscript-dropcap");
  });

  it("applies drop-cap class only to the first section of a sectioned body", () => {
    const { container } = render(
      <NodeBody
        sections={[
          { heading: "Overview", order: 0, bodyMd: "First body." },
          { heading: "Details", order: 1, bodyMd: "Second body." },
        ]}
        bodyMd=""
        wikilinks={emptyDeps.wikilinks}
        lexiconTooltips={emptyDeps.lexiconTooltips}
      />,
    );
    const sections = container.querySelectorAll("article > section");
    expect(sections).toHaveLength(2);
    expect(sections[0].className).toContain("prose-manuscript-dropcap");
    expect(sections[1].className ?? "").not.toContain(
      "prose-manuscript-dropcap",
    );
  });

  it("renders ornate divider for markdown horizontal rules", () => {
    const { container } = render(
      <NodeBody
        sections={[]}
        bodyMd={"Before\n\n---\n\nAfter"}
        wikilinks={emptyDeps.wikilinks}
        lexiconTooltips={emptyDeps.lexiconTooltips}
      />,
    );
    // The ornate divider is a div with role="separator"
    const sep = container.querySelector('[role="separator"]');
    expect(sep).not.toBeNull();
    // and contains the SVG glyph
    expect(sep?.querySelector("svg")).not.toBeNull();
  });

  it("frames markdown images in the entry-style container", () => {
    const { container } = render(
      <NodeBody
        sections={[]}
        bodyMd={"![A sketch](/img/sketch.jpg)"}
        wikilinks={emptyDeps.wikilinks}
        lexiconTooltips={emptyDeps.lexiconTooltips}
      />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/img/sketch.jpg");
    // wrapped in a span that carries the frame classes
    const outerFrame = img?.closest("span.border");
    expect(outerFrame).not.toBeNull();
  });
});
