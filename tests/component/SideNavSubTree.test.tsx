import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SidebarSection } from "@/lib/nav/sidebar-data";

type IOCallback = (entries: IntersectionObserverEntry[]) => void;
const ioInstances: Array<{ cb: IOCallback; targets: Element[] }> = [];

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
  // Stub IntersectionObserver — jsdom/happy-dom don't implement it.
  // The mock captures each instance so tests can drive the callback.
  ioInstances.length = 0;
  class MockIO implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds = [];
    private readonly cb: IOCallback;
    private readonly targets: Element[] = [];
    constructor(cb: IOCallback) {
      this.cb = cb;
      ioInstances.push({ cb, targets: this.targets });
    }
    observe(el: Element): void {
      this.targets.push(el);
    }
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).IntersectionObserver = MockIO;
});

function makeEntry(
  target: Element,
  width: number,
  height: number,
  ratio: number,
): IntersectionObserverEntry {
  const rect = {
    x: 0,
    y: 0,
    width,
    height,
    top: 0,
    right: width,
    bottom: height,
    left: 0,
    toJSON: () => ({}),
  } as DOMRectReadOnly;
  return {
    target,
    isIntersecting: true,
    intersectionRatio: ratio,
    intersectionRect: rect,
    boundingClientRect: rect,
    rootBounds: null,
    time: 0,
  };
}

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

  it("scrollspy ranks sections by visible area, not intersection ratio", () => {
    // Regression: a collapsed accordion header (~60px tall, fully on-screen)
    // has intersectionRatio 1.0, while the open section the user is reading
    // (~600px tall, half in view) has ratio ~0.5. Ranking by ratio highlights
    // the wrong section. Ranking by visible pixel area (width * height of
    // intersectionRect) picks the section that actually occupies the viewport.
    const figures = document.createElement("section");
    figures.id = "npc";
    const places = document.createElement("section");
    places.id = "location";
    document.body.append(figures, places);

    try {
      render(
        <SideNavSubTree
          sections={SECTIONS}
          initialContentsExpanded={true}
          isAuthenticated={false}
        />,
      );

      const io = ioInstances[0];
      expect(io).toBeDefined();

      // Figures: collapsed header, fully on-screen (ratio 1, area 800*60).
      // Places: expanded body, half-visible (ratio 0.5, area 800*300).
      act(() => {
        io.cb([
          makeEntry(figures, 800, 60, 1),
          makeEntry(places, 800, 300, 0.5),
        ]);
      });

      expect(screen.getByTestId("sidenav-category-location")).toHaveAttribute(
        "aria-current",
        "true",
      );
      expect(
        screen.getByTestId("sidenav-category-npc"),
      ).not.toHaveAttribute("aria-current", "true");
    } finally {
      figures.remove();
      places.remove();
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
