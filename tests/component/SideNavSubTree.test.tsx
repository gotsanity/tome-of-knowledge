import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SidebarSection } from "@/lib/nav/sidebar-data";
import {
  SECTION_HASH_EVENT,
  setSectionHash,
} from "@/app/contents/section-hash";

const setNavItemExpandedAction = vi.fn();

vi.mock("@/lib/nav/actions", () => ({
  setNavItemExpandedAction: (...args: unknown[]) =>
    setNavItemExpandedAction(...args),
}));

let mockPathname = "/contents";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { SideNavSubTree } from "@/app/components/SideNavSubTree";

const SECTIONS: SidebarSection[] = [
  {
    type: "npc",
    label: "Figures",
    count: 2,
    nodes: [
      { slug: "alice", displayName: "Alice" },
      { slug: "bob", displayName: "Bob" },
    ],
  },
  {
    type: "location",
    label: "Places",
    count: 1,
    nodes: [{ slug: "fort-ashby", displayName: "Fort Ashby" }],
  },
];

beforeEach(() => {
  setNavItemExpandedAction.mockReset();
  setNavItemExpandedAction.mockResolvedValue(undefined);
  mockPathname = "/contents";
  window.localStorage.clear();
  // Reset the URL hash between tests so hash-driven highlighting starts
  // from a known state.
  if (window.location.hash) {
    window.history.replaceState(null, "", window.location.pathname);
  }
});

describe("SideNavSubTree", () => {
  it("renders nothing when there are no sections", () => {
    const { container } = render(
      <SideNavSubTree
        sections={[]}
        initialContentsExpanded={true}
        isAuthenticated={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders category rows with counts when expanded", () => {
    render(
      <SideNavSubTree
        sections={SECTIONS}
        initialContentsExpanded={true}
        isAuthenticated={false}
      />,
    );
    expect(screen.getByTestId("sidenav-category-npc")).toHaveAttribute(
      "href",
      "/contents#npc",
    );
    expect(screen.getByTestId("sidenav-category-location")).toHaveAttribute(
      "href",
      "/contents#location",
    );
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("hides the category list when collapsed", () => {
    render(
      <SideNavSubTree
        sections={SECTIONS}
        initialContentsExpanded={false}
        isAuthenticated={false}
      />,
    );
    expect(screen.queryByTestId("sidenav-category-npc")).toBeNull();
    expect(screen.getByRole("button", { name: /show index/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("toggles expanded state when the caret button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SideNavSubTree
        sections={SECTIONS}
        initialContentsExpanded={true}
        isAuthenticated={false}
      />,
    );
    const button = screen.getByRole("button", { name: /hide index/i });
    await user.click(button);
    expect(screen.queryByTestId("sidenav-category-npc")).toBeNull();
    expect(
      screen.getByRole("button", { name: /show index/i }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("persists anonymous expanded state to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <SideNavSubTree
        sections={SECTIONS}
        initialContentsExpanded={true}
        isAuthenticated={false}
      />,
    );
    await user.click(screen.getByRole("button", { name: /hide index/i }));
    expect(window.localStorage.getItem("tome:nav:contents-expanded")).toBe("0");
    expect(setNavItemExpandedAction).not.toHaveBeenCalled();
  });

  it("calls the server action for authenticated users", async () => {
    const user = userEvent.setup();
    render(
      <SideNavSubTree
        sections={SECTIONS}
        initialContentsExpanded={true}
        isAuthenticated={true}
      />,
    );
    await user.click(screen.getByRole("button", { name: /hide index/i }));
    expect(setNavItemExpandedAction).toHaveBeenCalledWith("contents", false);
    expect(window.localStorage.getItem("tome:nav:contents-expanded")).toBeNull();
  });

  it("force-expands TOC and highlights the active node when currentNodeSlug is set", () => {
    mockPathname = "/node/bob";
    window.localStorage.setItem("tome:nav:contents-expanded", "0");
    render(
      <SideNavSubTree
        sections={SECTIONS}
        initialContentsExpanded={false}
        isAuthenticated={false}
        currentNodeSlug="bob"
      />,
    );
    // Subtree is forced open even though pref is collapsed
    const npcCategory = screen.getByTestId("sidenav-category-npc");
    expect(npcCategory).toBeInTheDocument();
    expect(npcCategory).toHaveAttribute("aria-current", "true");
    // The active node is rendered and marked
    const activeNode = screen.getByTestId("sidenav-node-bob");
    expect(activeNode).toHaveAttribute("aria-current", "page");
    // The non-matching category is not marked active
    expect(screen.getByTestId("sidenav-category-location")).not.toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("highlights the section matching the URL hash on /contents", () => {
    window.history.replaceState(null, "", "/contents#location");
    render(
      <SideNavSubTree
        sections={SECTIONS}
        initialContentsExpanded={true}
        isAuthenticated={false}
      />,
    );
    expect(screen.getByTestId("sidenav-category-location")).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(
      screen.getByTestId("sidenav-category-npc"),
    ).not.toHaveAttribute("aria-current", "true");
  });

  it("defaults the highlight to the first section on /contents with no hash", () => {
    render(
      <SideNavSubTree
        sections={SECTIONS}
        initialContentsExpanded={true}
        isAuthenticated={false}
      />,
    );
    expect(screen.getByTestId("sidenav-category-npc")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("updates the highlight when the accordion broadcasts a section change", () => {
    render(
      <SideNavSubTree
        sections={SECTIONS}
        initialContentsExpanded={true}
        isAuthenticated={false}
      />,
    );
    expect(screen.getByTestId("sidenav-category-npc")).toHaveAttribute(
      "aria-current",
      "true",
    );
    act(() => {
      setSectionHash("location");
    });
    expect(screen.getByTestId("sidenav-category-location")).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(
      screen.getByTestId("sidenav-category-npc"),
    ).not.toHaveAttribute("aria-current", "true");
  });

  it("dispatches a section-change event when a category link is clicked on /contents", async () => {
    const user = userEvent.setup();
    const events: string[] = [];
    const listener = (e: Event) => {
      const detail = (e as CustomEvent<{ type: string }>).detail;
      if (detail) events.push(detail.type);
    };
    window.addEventListener(SECTION_HASH_EVENT, listener);
    try {
      render(
        <SideNavSubTree
          sections={SECTIONS}
          initialContentsExpanded={true}
          isAuthenticated={false}
        />,
      );
      await user.click(screen.getByTestId("sidenav-category-location"));
      expect(events).toContain("location");
      expect(window.location.hash).toBe("#location");
    } finally {
      window.removeEventListener(SECTION_HASH_EVENT, listener);
    }
  });

  it("reconciles anonymous initial state with localStorage on mount", () => {
    window.localStorage.setItem("tome:nav:contents-expanded", "0");
    render(
      <SideNavSubTree
        sections={SECTIONS}
        initialContentsExpanded={true}
        isAuthenticated={false}
      />,
    );
    expect(screen.queryByTestId("sidenav-category-npc")).toBeNull();
  });
});
