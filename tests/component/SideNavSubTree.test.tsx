import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SidebarSection } from "@/lib/nav/sidebar-data";

const setNavItemExpandedAction = vi.fn();

vi.mock("@/lib/nav/actions", () => ({
  setNavItemExpandedAction: (...args: unknown[]) =>
    setNavItemExpandedAction(...args),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/contents",
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
  window.localStorage.clear();
  // Stub IntersectionObserver — jsdom/happy-dom don't implement it
  class MockIO implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds = [];
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).IntersectionObserver = MockIO;
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
