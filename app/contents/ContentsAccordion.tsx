"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { LoadedNode } from "@/lib/vault/loaders";
import type { NodeType } from "@/lib/db/schema";

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
  const [openType, setOpenType] = useState<NodeType | null>(
    sections[0]?.type ?? null,
  );

  const handleHeaderClick = useCallback((type: NodeType) => {
    setOpenType(type);
  }, []);

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
