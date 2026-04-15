import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScribeButton } from "@/app/components/ScribeButton";

describe("ScribeButton", () => {
  it("renders as a link to the provided href with the default aria-label", () => {
    render(<ScribeButton href="/scribe" />);
    const link = screen.getByRole("link", { name: /edit this entry/i });
    expect(link.getAttribute("href")).toBe("/scribe");
  });

  it("accepts a custom aria-label", () => {
    render(<ScribeButton href="/scribe/foo" label="Edit chronicle" />);
    const link = screen.getByRole("link", { name: /edit chronicle/i });
    expect(link.getAttribute("href")).toBe("/scribe/foo");
  });

  it("uses the ink_pen material icon glyph", () => {
    const { container } = render(<ScribeButton href="/scribe" />);
    const icon = container.querySelector(".material-symbols-outlined");
    expect(icon?.textContent).toBe("ink_pen");
  });
});
