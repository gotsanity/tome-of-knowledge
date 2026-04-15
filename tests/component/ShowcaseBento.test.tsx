import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ShowcaseBento } from "@/app/components/ShowcaseBento";

function renderFixture() {
  return render(
    <ShowcaseBento
      title="The Library"
      featured={<div data-testid="featured">Featured Tile</div>}
      secondaries={[
        <div key="a" data-testid="sec-a">
          Secondary A
        </div>,
        <div key="b" data-testid="sec-b">
          Secondary B
        </div>,
      ]}
    />,
  );
}

describe("ShowcaseBento", () => {
  it("renders the title as a heading", () => {
    renderFixture();
    expect(
      screen.getByRole("heading", { name: "The Library", level: 2 }),
    ).toBeInTheDocument();
  });

  it("renders the featured tile and all secondary tiles", () => {
    renderFixture();
    expect(screen.getByTestId("featured")).toBeInTheDocument();
    expect(screen.getByTestId("sec-a")).toBeInTheDocument();
    expect(screen.getByTestId("sec-b")).toBeInTheDocument();
  });

  it("defaults to grid view with the grid toggle pressed", () => {
    renderFixture();
    expect(screen.getByRole("button", { name: /grid view/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /list view/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByTestId("showcase-bento")).toHaveAttribute(
      "data-view",
      "grid",
    );
  });

  it("switches to list arrangement when the list toggle is clicked", () => {
    renderFixture();
    fireEvent.click(screen.getByRole("button", { name: /list view/i }));

    expect(screen.getByRole("button", { name: /list view/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /grid view/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByTestId("showcase-bento")).toHaveAttribute(
      "data-view",
      "list",
    );
  });

  it("switches back to grid when the grid toggle is clicked", () => {
    renderFixture();
    fireEvent.click(screen.getByRole("button", { name: /list view/i }));
    fireEvent.click(screen.getByRole("button", { name: /grid view/i }));
    expect(screen.getByTestId("showcase-bento")).toHaveAttribute(
      "data-view",
      "grid",
    );
  });
});
