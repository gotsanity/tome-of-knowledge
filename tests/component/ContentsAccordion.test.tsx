import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LoadedNode } from "@/lib/vault/loaders";
import type { NodeType } from "@/lib/db/schema";

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

import { ContentsAccordion } from "@/app/contents/ContentsAccordion";
import {
  SECTION_HASH_EVENT,
  setSectionHash,
} from "@/app/contents/section-hash";

function makeNode(slug: string, name: string, type: NodeType): LoadedNode {
  return {
    id: slug,
    slug,
    type,
    name,
    visibility: "published",
    depthTier: null,
    status: null,
    frontmatter: {},
    bodyMd: "",
    companionSlug: null,
    sourcePath: `${slug}.md`,
    sections: [],
  };
}

const SECTIONS = [
  {
    type: "npc" as const,
    label: "Figures",
    nodes: [
      makeNode("alice", "Alice", "npc"),
      makeNode("bob", "Bob", "npc"),
    ],
  },
  {
    type: "location" as const,
    label: "Places",
    nodes: [makeNode("fort-ashby", "Fort Ashby", "location")],
  },
];

const scrollIntoViewMock = vi.fn();

beforeEach(() => {
  scrollIntoViewMock.mockReset();
  // jsdom doesn't implement scrollIntoView; stub it on the prototype so
  // every <section> element our component creates picks it up.
  Element.prototype.scrollIntoView = scrollIntoViewMock;
  // Stub requestAnimationFrame to fire synchronously with a monotonically
  // advancing timestamp. Each anchor invocation needs the second frame's
  // timestamp to exceed the first by more than the animation duration
  // (1480ms), so we step 5s per frame. A monotonic counter (rather than a
  // toggle) ensures repeated anchor invocations within one test still
  // terminate.
  let rafTime = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    rafTime += 5000;
    cb(rafTime);
    return rafTime;
  });
  // Reset URL hash between tests.
  if (window.location.hash) {
    window.history.replaceState(null, "", window.location.pathname);
  }
});

describe("ContentsAccordion", () => {
  it("opens the first section by default", () => {
    render(<ContentsAccordion sections={SECTIONS} />);
    const npcButton = screen.getByRole("button", { name: /figures/i });
    const placesButton = screen.getByRole("button", { name: /places/i });
    expect(npcButton).toHaveAttribute("aria-expanded", "true");
    expect(placesButton).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the section matching the URL hash on mount", () => {
    window.history.replaceState(null, "", "/contents#location");
    render(<ContentsAccordion sections={SECTIONS} />);
    expect(
      screen.getByRole("button", { name: /places/i }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: /figures/i }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("clicking a header opens that section, updates the hash, and scrolls", async () => {
    const user = userEvent.setup();
    render(<ContentsAccordion sections={SECTIONS} />);
    await user.click(screen.getByRole("button", { name: /places/i }));
    expect(
      screen.getByRole("button", { name: /places/i }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(window.location.hash).toBe("#location");
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it("reacts to a section-change event from the sidebar", () => {
    render(<ContentsAccordion sections={SECTIONS} />);
    expect(
      screen.getByRole("button", { name: /figures/i }),
    ).toHaveAttribute("aria-expanded", "true");
    act(() => {
      setSectionHash("location");
    });
    expect(
      screen.getByRole("button", { name: /places/i }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: /figures/i }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("ignores section-change events for unknown types", () => {
    render(<ContentsAccordion sections={SECTIONS} />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent(SECTION_HASH_EVENT, {
          detail: { type: "not-a-section" },
        }),
      );
    });
    // Still showing the default
    expect(
      screen.getByRole("button", { name: /figures/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
