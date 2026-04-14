import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NodeBlock } from "@/app/components/NodeBlock";

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
    render(<NodeBlock label="Motivation" value="Hide the truth" gmOnly />);
    expect(screen.getByTitle("GM only")).toBeTruthy();
  });

  it("renders list values as a bulleted list", () => {
    render(<NodeBlock label="Themes" value={["fate", "decay", "ambition"]} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
