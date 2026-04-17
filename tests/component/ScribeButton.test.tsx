import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScribeButton } from "@/app/components/ScribeButton";

describe("ScribeButton", () => {
  it("links to /scribe/node/<slug> for a node subject", () => {
    render(<ScribeButton kind="node" slug="fort-ashby" />);
    const link = screen.getByRole("link", { name: /edit this entry/i });
    expect(link.getAttribute("href")).toBe("/scribe/node/fort-ashby");
  });

  it("links to /scribe/page/<slug> for a page subject", () => {
    render(<ScribeButton kind="page" slug="house-rules" />);
    const link = screen.getByRole("link", { name: /edit this entry/i });
    expect(link.getAttribute("href")).toBe("/scribe/page/house-rules");
  });

  it("accepts a custom aria-label", () => {
    render(<ScribeButton kind="node" slug="foo" label="Edit chronicle" />);
    const link = screen.getByRole("link", { name: /edit chronicle/i });
    expect(link.getAttribute("href")).toBe("/scribe/node/foo");
  });

  it("uses the ink_pen material icon glyph", () => {
    const { container } = render(<ScribeButton kind="node" slug="foo" />);
    const icon = container.querySelector(".material-symbols-outlined");
    expect(icon?.textContent).toBe("ink_pen");
  });
});
