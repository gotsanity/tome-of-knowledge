"use client";

import { useCallback, useEffect, useId, useState, type ReactNode } from "react";

type TermData = {
  slug: string;
  term: string;
  domain: string;
  definition: string;
};

const termCache = new Map<string, Promise<TermData | null>>();

function fetchTerm(slug: string): Promise<TermData | null> {
  const cached = termCache.get(slug);
  if (cached) return cached;
  const promise = fetch(`/api/lexicon/${slug}`)
    .then(async (res) => {
      if (!res.ok) return null;
      return (await res.json()) as TermData;
    })
    .catch(() => null);
  termCache.set(slug, promise);
  return promise;
}

type Props = {
  slug: string;
  children: ReactNode;
};

export function LexiconTooltip({ slug, children }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<TermData | null>(null);
  const reactId = useId();
  const tooltipId = `lex-${reactId}`;

  const load = useCallback(async () => {
    if (data) return;
    const result = await fetchTerm(slug);
    if (result) setData(result);
  }, [data, slug]);

  const show = useCallback(() => {
    void load();
    setOpen(true);
  }, [load]);

  const hide = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const showTooltip = open && data !== null;

  return (
    <span className="relative inline-block">
      <a
        href={`/lexicon/${slug}`}
        className="text-primary underline decoration-dotted decoration-1 decoration-primary/60 underline-offset-4 hover:decoration-primary"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={showTooltip ? tooltipId : undefined}
      >
        {children}
      </a>
      {showTooltip && (
        <span
          role="tooltip"
          id={tooltipId}
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-72 bg-surface-container-high/80 backdrop-blur-md border border-outline-variant p-4 text-sm text-on-surface-variant rounded-sm not-italic shadow-[0_0_48px_rgba(249,239,228,0.05)]"
        >
          <span className="block text-[10px] uppercase tracking-[0.2em] text-outline mb-1">
            {data.domain}
          </span>
          <span className="block font-bold text-on-surface mb-1">
            {data.term}
          </span>
          <span className="block leading-relaxed italic">
            {data.definition}
          </span>
        </span>
      )}
    </span>
  );
}
