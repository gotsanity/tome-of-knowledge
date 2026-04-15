"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LoadedNode } from "@/lib/vault/loaders";
import type { NodeType } from "@/lib/db/schema";
import {
  SECTION_HASH_EVENT,
  readSectionFromHash,
  setSectionHash,
  type SectionHashDetail,
} from "./section-hash";

// Matches `duration-[1400ms]` on the grid-rows transition below. We anchor
// the clicked section's header to the viewport top for slightly longer
// than the animation runs so the rAF loop covers the full reflow window.
const ANIMATION_DURATION_MS = 1400;
const ANCHOR_BUFFER_MS = 80;

const ROMAN_NUMERALS = [
  "I.",
  "II.",
  "III.",
  "IV.",
  "V.",
  "VI.",
  "VII.",
  "VIII.",
  "IX.",
  "X.",
  "XI.",
  "XII.",
  "XIII.",
  "XIV.",
  "XV.",
];

function displayName(node: LoadedNode): string {
  const raw = node.name;
  if (/\s/.test(raw) || /[A-Z]/.test(raw)) return raw;
  return raw
    .split("-")
    .filter((s) => s.length > 0)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export type AccordionSection = {
  type: NodeType;
  label: string;
  nodes: LoadedNode[];
};


export function ContentsAccordion({
  sections,
}: {
  sections: AccordionSection[];
}) {
  const knownTypes = useMemo(() => sections.map((s) => s.type), [sections]);
  const [openType, setOpenType] = useState<NodeType | null>(() => {
    // SSR + first client render must agree, so we don't read window here.
    // The hash-sync effect below reconciles to the URL hash on mount.
    return sections[0]?.type ?? null;
  });
  const sectionRefs = useRef(new Map<NodeType, HTMLElement | null>());

  // Anchor the clicked section's header to the top of the viewport for
  // the duration of the open/close animation. Without this, the section
  // *above* the click point collapses, the document reflows shorter, and
  // the section the user just clicked drifts up off-screen.
  //
  // We can't compute a single target scrollTop up-front because the grid
  // transition continuously interpolates heights — `getBoundingClientRect`
  // returns mid-animation values. Instead, re-pin every animation frame
  // until the transition ends. `scroll-mt-32` on the section element gives
  // scrollIntoView a 128px top offset to clear the sticky TopAppBar.
  const anchorSectionToTop = useCallback((type: NodeType) => {
    if (typeof window === "undefined") return;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now;
      const el = sectionRefs.current.get(type);
      if (!el) return;
      el.scrollIntoView({ block: "start", behavior: "auto" });
      if (now - start < ANIMATION_DURATION_MS + ANCHOR_BUFFER_MS) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }, []);

  const openSection = useCallback(
    (type: NodeType, options: { updateHash: boolean; scroll: boolean }) => {
      setOpenType(type);
      if (options.updateHash) {
        setSectionHash(type);
      }
      if (options.scroll) {
        anchorSectionToTop(type);
      }
    },
    [anchorSectionToTop],
  );

  // On mount, reconcile to whatever section the URL hash points at.
  useEffect(() => {
    const initial = readSectionFromHash();
    if (initial && knownTypes.includes(initial as NodeType)) {
      openSection(initial as NodeType, { updateHash: false, scroll: true });
    }
    // We only want this to run once on mount — the hash listener below
    // handles subsequent changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to hash changes from the sidebar, back/forward, or URL edits.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const known = new Set(knownTypes);
    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent<SectionHashDetail>).detail;
      if (!detail) return;
      if (!known.has(detail.type as NodeType)) return;
      const next = detail.type as NodeType;
      setOpenType(next);
      anchorSectionToTop(next);
    };
    const handleNative = () => {
      const next = readSectionFromHash();
      if (next && known.has(next as NodeType)) {
        setOpenType(next as NodeType);
        anchorSectionToTop(next as NodeType);
      }
    };
    window.addEventListener(SECTION_HASH_EVENT, handleCustom);
    window.addEventListener("hashchange", handleNative);
    return () => {
      window.removeEventListener(SECTION_HASH_EVENT, handleCustom);
      window.removeEventListener("hashchange", handleNative);
    };
  }, [knownTypes, anchorSectionToTop]);

  const handleHeaderClick = useCallback(
    (type: NodeType) => {
      openSection(type, { updateHash: true, scroll: true });
    },
    [openSection],
  );

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => {
        const isOpen = openType === section.type;
        const bodyId = `section-body-${section.type}`;
        const headerId = `section-header-${section.type}`;
        return (
          <section
            key={section.type}
            id={section.type}
            ref={(el) => {
              sectionRefs.current.set(section.type, el);
            }}
            data-contents-section={section.type}
            className="scroll-mt-32 border-b border-outline-variant/30"
          >
            <button
              type="button"
              id={headerId}
              onClick={() => handleHeaderClick(section.type)}
              aria-expanded={isOpen}
              aria-controls={bodyId}
              className="group w-full flex items-center gap-4 py-4 -mx-2 px-2 rounded-sm hover:bg-surface-variant/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="text-primary text-4xl font-bold leading-none">
                {ROMAN_NUMERALS[idx] ?? `${idx + 1}.`}
              </span>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                {section.label}
              </h2>
              <div className="flex-grow h-px bg-primary/20" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-outline">
                {section.nodes.length}{" "}
                {section.nodes.length === 1 ? "entry" : "entries"}
              </span>
              <span
                className={`material-symbols-outlined text-primary/60 text-lg transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isOpen ? "rotate-90" : ""
                }`}
                aria-hidden
              >
                chevron_right
              </span>
            </button>
            <div
              id={bodyId}
              role="region"
              aria-labelledby={headerId}
              className={`grid transition-[grid-template-rows,opacity] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <ul className="space-y-4 pt-4 pb-8 pl-12">
                  {section.nodes
                    .slice()
                    .sort((a, b) =>
                      displayName(a).localeCompare(displayName(b)),
                    )
                    .map((node) => (
                      <li
                        key={node.slug}
                        className="group/row flex items-end"
                      >
                        <Link
                          href={`/node/${node.slug}`}
                          className="text-lg text-on-surface group-hover/row:text-primary transition-colors duration-300"
                          tabIndex={isOpen ? 0 : -1}
                        >
                          {displayName(node)}
                        </Link>
                        <span className="leader-dots" />
                        <span className="italic text-primary/60 text-sm uppercase tracking-widest">
                          {node.visibility === "published"
                            ? "open"
                            : node.visibility}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
