import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { CategoryIndex } from "@/app/components/CategoryIndex";

const items = [
  {
    href: "/contents#npc",
    letter: "Fi",
    label: "Figures",
    blurb: "The named hands that shape the world.",
  },
  {
    href: "/contents#location",
    letter: "Pl",
    label: "Places",
    blurb: "Cities, ruins, and crossroads worth naming.",
  },
  {
    href: "/contents#faction",
    letter: "Fa",
    label: "Factions",
    blurb: "Cabals, orders, and powers vying for their cause.",
  },
];

describe("CategoryIndex", () => {
  it("renders one link per item with letter, label, and blurb", () => {
    render(<CategoryIndex items={items} />);
    for (const item of items) {
      const link = screen.getByRole("link", {
        name: new RegExp(`Browse ${item.label}`, "i"),
      });
      expect(link).toHaveAttribute("href", item.href);
      expect(within(link).getByText(item.letter)).toBeInTheDocument();
      expect(within(link).getByText(item.label)).toBeInTheDocument();
      expect(within(link).getByText(item.blurb)).toBeInTheDocument();
    }
  });

  it("uses the default aria-label when none is provided", () => {
    render(<CategoryIndex items={items} />);
    expect(
      screen.getByRole("navigation", { name: /category index/i }),
    ).toBeInTheDocument();
  });

  it("honors a custom aria-label", () => {
    render(<CategoryIndex items={items} ariaLabel="Related chapters" />);
    expect(
      screen.getByRole("navigation", { name: /related chapters/i }),
    ).toBeInTheDocument();
  });

  it("renders an empty nav when items is empty", () => {
    render(<CategoryIndex items={[]} />);
    const nav = screen.getByRole("navigation", { name: /category index/i });
    expect(nav).toBeEmptyDOMElement();
  });
});
