"use client";

import {
  cloneElement,
  Fragment,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { SectionHeading } from "./SectionHeading";

type View = "grid" | "list";

type Props = {
  title: string;
  featured: ReactNode;
  secondaries: readonly ReactNode[];
};

function addClass(node: ReactNode, extra: string): ReactNode {
  if (!extra || !isValidElement(node)) return node;
  const el = node as ReactElement<{ className?: string }>;
  const existing = el.props.className ?? "";
  const merged = existing ? `${existing} ${extra}` : extra;
  return cloneElement(el, { className: merged });
}

export function ShowcaseBento({ title, featured, secondaries }: Props) {
  const [view, setView] = useState<View>("grid");

  const toggleButtonClass = (active: boolean) =>
    `p-2 border transition-colors ${
      active
        ? "border-primary/60 text-primary"
        : "border-stone-800 text-stone-500 hover:text-primary"
    }`;

  const actions = (
    <>
      <button
        type="button"
        aria-label="Grid view"
        aria-pressed={view === "grid"}
        onClick={() => setView("grid")}
        className={toggleButtonClass(view === "grid")}
      >
        <span aria-hidden="true" className="material-symbols-outlined">
          grid_view
        </span>
      </button>
      <button
        type="button"
        aria-label="List view"
        aria-pressed={view === "list"}
        onClick={() => setView("list")}
        className={toggleButtonClass(view === "list")}
      >
        <span aria-hidden="true" className="material-symbols-outlined">
          list
        </span>
      </button>
    </>
  );

  const keyedSecondaries = secondaries.map((tile, i) => (
    <Fragment key={i}>{tile}</Fragment>
  ));

  return (
    <>
      <SectionHeading title={title} actions={actions} />
      {view === "grid" ? (
        <div
          data-testid="showcase-bento"
          data-view="grid"
          className="grid grid-cols-1 md:grid-cols-12 gap-8"
        >
          {addClass(featured, "md:col-span-7")}
          <div className="md:col-span-5 grid grid-rows-2 gap-8">
            {keyedSecondaries}
          </div>
        </div>
      ) : (
        <div
          data-testid="showcase-bento"
          data-view="list"
          className="flex flex-col gap-8"
        >
          {featured}
          {keyedSecondaries}
        </div>
      )}
    </>
  );
}
