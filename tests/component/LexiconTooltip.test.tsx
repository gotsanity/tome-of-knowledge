import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { LexiconTooltip } from "@/app/components/LexiconTooltip";

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      slug: "mantle",
      term: "Mantle",
      domain: "World",
      definition: "A physical object that contains divine authority.",
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = mockFetch;
  // Reset the module cache between tests by dynamic reimport — handled per-test.
});

describe("LexiconTooltip", () => {
  it("renders the child text as an accessible anchor", () => {
    render(<LexiconTooltip slug="mantle">mantle</LexiconTooltip>);
    const anchor = screen.getByRole("link", { name: /mantle/i });
    expect(anchor).toHaveAttribute("href", "/lexicon/mantle");
  });

  it("fetches the definition on hover and shows the tooltip", async () => {
    render(<LexiconTooltip slug="mantle">mantle</LexiconTooltip>);
    const anchor = screen.getByRole("link", { name: /mantle/i });
    fireEvent.mouseEnter(anchor);
    await waitFor(() => {
      expect(
        screen.getByText(/A physical object that contains divine authority/i),
      ).toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledWith("/api/lexicon/mantle");
  });

  it("shows the tooltip on keyboard focus", async () => {
    render(<LexiconTooltip slug="mantle">mantle</LexiconTooltip>);
    const anchor = screen.getByRole("link", { name: /mantle/i });
    anchor.focus();
    await waitFor(() => {
      expect(
        screen.getByText(/A physical object that contains divine authority/i),
      ).toBeInTheDocument();
    });
  });

  it("associates the tooltip with the anchor via aria-describedby", async () => {
    render(<LexiconTooltip slug="mantle">mantle</LexiconTooltip>);
    const anchor = screen.getByRole("link", { name: /mantle/i });
    fireEvent.mouseEnter(anchor);
    await waitFor(() => {
      const tooltip = screen.getByRole("tooltip");
      expect(anchor).toHaveAttribute("aria-describedby", tooltip.id);
    });
  });

  it("passes an axe accessibility scan when closed", async () => {
    const { container } = render(
      <LexiconTooltip slug="mantle">mantle</LexiconTooltip>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("passes an axe accessibility scan when open", async () => {
    const { container } = render(
      <LexiconTooltip slug="mantle">mantle</LexiconTooltip>,
    );
    const anchor = screen.getByRole("link", { name: /mantle/i });
    fireEvent.mouseEnter(anchor);
    await waitFor(() => screen.getByRole("tooltip"));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("hides the tooltip when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<LexiconTooltip slug="mantle">mantle</LexiconTooltip>);
    const anchor = screen.getByRole("link", { name: /mantle/i });
    fireEvent.mouseEnter(anchor);
    await waitFor(() => screen.getByRole("tooltip"));
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });
});
