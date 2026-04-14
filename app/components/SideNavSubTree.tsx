"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { usePathname } from "next/navigation";
import type { NodeType } from "@/lib/db/schema";
import type { SidebarSection } from "@/lib/nav/sidebar-data";
import { setNavItemExpandedAction } from "@/lib/nav/actions";

const STORAGE_KEY = "tome:nav:contents-expanded";

type Props = {
  sections: SidebarSection[];
  initialContentsExpanded: boolean;
  isAuthenticated: boolean;
  currentNodeSlug?: string;
};

function subscribeStorage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readLocalStorageFlag(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeLocalExpanded(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

export function SideNavSubTree({
  sections,
  initialContentsExpanded,
  isAuthenticated,
  currentNodeSlug,
}: Props) {
  // Authoritative sources of truth:
  //   Authenticated → server-rendered `initialContentsExpanded` + optimistic local flips.
  //   Anonymous     → localStorage via useSyncExternalStore, seeded with the prop on SSR.
  const storedFlag = useSyncExternalStore(
    subscribeStorage,
    readLocalStorageFlag,
    () => null,
  );
  const localExpanded =
    storedFlag === null ? initialContentsExpanded : storedFlag === "1";

  const [authExpanded, setAuthExpanded] = useState(initialContentsExpanded);
  const prefExpanded = isAuthenticated ? authExpanded : localExpanded;
  // When viewing a specific node, force the TOC open so the active node is
  // visible regardless of the user's saved collapse preference.
  const expanded = Boolean(currentNodeSlug) || prefExpanded;

  const nodeCategory: NodeType | null = currentNodeSlug
    ? (sections.find((s) =>
        s.nodes.some((n) => n.slug === currentNodeSlug),
      )?.type ?? null)
    : null;

  const [activeCategory, setActiveCategory] = useState<NodeType | null>(null);
  const [, startTransition] = useTransition();
  const pathname = usePathname();

  // Scroll-spy: observe section[id] elements matching known NodeType values
  // on the current page. On pages without such sections the observer is a
  // no-op and activeCategory stays null.
  useEffect(() => {
    if (!expanded) return;
    if (typeof window === "undefined") return;

    const knownIds = new Set(sections.map((s) => s.type));
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("section[id]"),
    ).filter((el) => knownIds.has(el.id as NodeType));

    if (targets.length === 0) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.intersectionRatio);
          } else {
            visible.delete(entry.target.id);
          }
        }
        if (visible.size === 0) {
          setActiveCategory(null);
          return;
        }
        // Pick the target with the highest visible ratio; fall back to
        // document order on ties (which happens often with the accordion
        // layout where most sections collapse to a thin header row).
        let best: { id: string; ratio: number } | null = null;
        for (const target of targets) {
          const ratio = visible.get(target.id);
          if (ratio === undefined) continue;
          if (!best || ratio > best.ratio) {
            best = { id: target.id, ratio };
          }
        }
        setActiveCategory((best?.id ?? null) as NodeType | null);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [expanded, sections, pathname]);

  const toggleExpanded = useCallback(() => {
    const next = !expanded;
    if (isAuthenticated) {
      setAuthExpanded(next);
      startTransition(() => {
        setNavItemExpandedAction("contents", next).catch(() => {
          // swallow — UI state stays optimistic
        });
      });
    } else {
      writeLocalExpanded(next);
      // Notify same-tab subscribers since the "storage" event only fires
      // in other tabs. useSyncExternalStore won't re-read otherwise.
      window.dispatchEvent(new Event("storage"));
    }
  }, [expanded, isAuthenticated]);

  if (sections.length === 0) return null;

  return (
    <div className="pl-6 pr-4 pb-2">
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        aria-controls="sidenav-contents-list"
        className="w-full flex items-center gap-2 py-1 text-[10px] uppercase tracking-widest text-stone-500 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60"
      >
        <span
          className="material-symbols-outlined text-sm"
          aria-hidden="true"
        >
          {expanded ? "expand_more" : "chevron_right"}
        </span>
        <span>{expanded ? "Hide index" : "Show index"}</span>
      </button>
      {expanded && (
        <ul
          id="sidenav-contents-list"
          className="mt-2 space-y-1 border-l border-stone-800/60 pl-3"
        >
          {sections.map((section) => {
            const isActive =
              activeCategory === section.type || nodeCategory === section.type;
            return (
              <li key={section.type}>
                <Link
                  href={`/contents#${section.type}`}
                  className={
                    "flex items-center justify-between gap-2 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 " +
                    (isActive
                      ? "text-primary font-semibold"
                      : "text-stone-400 hover:text-primary")
                  }
                  data-testid={`sidenav-category-${section.type}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span className="truncate">{section.label}</span>
                  <span className="text-[10px] text-stone-600 tabular-nums">
                    {section.count}
                  </span>
                </Link>
                {isActive && section.nodes.length > 0 && (
                  <ul className="mt-1 mb-2 space-y-0.5 border-l border-primary/20 pl-3">
                    {section.nodes.map((node) => {
                      const isCurrent = node.slug === currentNodeSlug;
                      return (
                        <li key={node.slug}>
                          <Link
                            href={`/node/${node.slug}`}
                            className={
                              "block py-0.5 text-xs transition-colors truncate focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 " +
                              (isCurrent
                                ? "text-primary font-semibold"
                                : "text-stone-500 hover:text-primary")
                            }
                            data-testid={`sidenav-node-${node.slug}`}
                            aria-current={isCurrent ? "page" : undefined}
                          >
                            {node.displayName}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
