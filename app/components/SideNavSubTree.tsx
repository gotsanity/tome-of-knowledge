"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { usePathname } from "next/navigation";
import type { NodeType } from "@/lib/db/schema";
import type { SidebarSection } from "@/lib/nav/sidebar-data";
import { setNavItemExpandedAction } from "@/lib/nav/actions";
import {
  SECTION_HASH_EVENT,
  readSectionFromHash,
  setSectionHash,
  type SectionHashDetail,
} from "@/app/contents/section-hash";

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

  // Reflect the URL hash (and the in-page custom event) into the highlight.
  // This replaces the previous IntersectionObserver scroll-spy: the accordion
  // is the source of truth for which section is "active", and it broadcasts
  // through the hash whenever the user opens a section.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const known = new Set(sections.map((s) => s.type));

    const updateFromHash = () => {
      const next = readSectionFromHash();
      if (next && known.has(next as NodeType)) {
        setActiveCategory(next as NodeType);
      } else if (pathname === "/contents") {
        // No hash on /contents → the accordion defaults to its first
        // section, so mirror that as the active highlight.
        setActiveCategory((sections[0]?.type as NodeType) ?? null);
      } else {
        setActiveCategory(null);
      }
    };
    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent<SectionHashDetail>).detail;
      if (detail && known.has(detail.type as NodeType)) {
        setActiveCategory(detail.type as NodeType);
      }
    };
    updateFromHash();
    window.addEventListener("hashchange", updateFromHash);
    window.addEventListener(SECTION_HASH_EVENT, handleCustom);
    return () => {
      window.removeEventListener("hashchange", updateFromHash);
      window.removeEventListener(SECTION_HASH_EVENT, handleCustom);
    };
  }, [pathname, sections]);

  // When the user clicks a sidebar category while already on /contents, we
  // intercept the navigation so we go through the shared `setSectionHash`
  // helper. That guarantees the accordion's custom-event listener fires
  // (history.replaceState, which the helper uses, never emits hashchange).
  // Off-page (e.g. /node/...), let the Link navigate normally — the
  // accordion will read the URL hash on mount.
  const handleCategoryClick = useCallback(
    (type: NodeType) => (e: ReactMouseEvent<HTMLAnchorElement>) => {
      if (pathname === "/contents") {
        e.preventDefault();
        setSectionHash(type);
      }
    },
    [pathname],
  );

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
                  onClick={handleCategoryClick(section.type)}
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
