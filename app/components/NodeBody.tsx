import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import {
  remarkWikilinks,
  type WikilinksOptions,
} from "@/lib/vault/remark-wikilinks";
import {
  remarkLexiconTooltips,
  type LexiconTooltipsOptions,
} from "@/lib/vault/remark-lexicon-tooltips";
import { LexiconTooltip } from "./LexiconTooltip";
import type { LoadedSection } from "@/lib/vault/loaders";

type Props = {
  sections: LoadedSection[];
  bodyMd: string;
  wikilinks: WikilinksOptions;
  lexiconTooltips: LexiconTooltipsOptions;
};

const components: Components = {
  a({ href, children, ...rest }) {
    if (typeof href === "string" && href.startsWith("/lexicon/")) {
      const slug = href.replace("/lexicon/", "");
      return <LexiconTooltip slug={slug}>{children}</LexiconTooltip>;
    }
    if (typeof href === "string" && href.startsWith("/")) {
      return <Link href={href}>{children}</Link>;
    }
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
  // Ornate divider to match the /entry page's section break treatment.
  hr() {
    return (
      <div className="my-12 relative" role="separator" aria-hidden>
        <div className="absolute -left-4 -right-4 top-1/2 border-t border-primary/20" />
        <div className="relative flex justify-center">
          <span className="bg-background px-4">
            <svg
              className="fill-primary/40"
              width="40"
              height="20"
              viewBox="0 0 40 20"
            >
              <path d="M0 10 L15 10 L20 0 L25 10 L40 10 L25 10 L20 20 L15 10 Z" />
            </svg>
          </span>
        </div>
      </div>
    );
  },
  // Frame every markdown image in the /entry-style border + grayscale
  // hover treatment. Eventually multiple adjacent images could flow into a
  // grid, but individual framing covers the single-image case already.
  img({ src, alt }) {
    if (typeof src !== "string") return null;
    return (
      <span className="block my-10 p-1 border border-primary/20 bg-stone-900/40 rounded">
        <span className="block w-full bg-gradient-to-br from-stone-800 via-stone-900 to-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt ?? ""}
            className="block w-full h-auto grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
          />
        </span>
      </span>
    );
  },
};

/**
 * Renders a node's body as plain markdown for step 5. Wikilink rewriting and
 * lexicon tooltips land in later steps via custom remark plugins on the same
 * pipeline.
 */
export function NodeBody({
  sections,
  bodyMd,
  wikilinks,
  lexiconTooltips,
}: Props) {
  const plugins = [
    remarkGfm,
    [remarkWikilinks, wikilinks],
    [remarkLexiconTooltips, lexiconTooltips],
  ];

  if (sections.length === 0) {
    return (
      <article className="prose-manuscript prose-manuscript-dropcap">
        <ReactMarkdown remarkPlugins={plugins as never} components={components}>
          {bodyMd}
        </ReactMarkdown>
      </article>
    );
  }

  return (
    <article className="prose-manuscript space-y-10">
      {sections.map((section, idx) => (
        <section
          key={`${section.order}-${section.heading}`}
          className={idx === 0 ? "prose-manuscript-dropcap" : undefined}
        >
          {section.heading && (
            <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-primary/90 mb-4">
              {section.heading}
            </h2>
          )}
          <ReactMarkdown
            remarkPlugins={plugins as never}
            components={components}
          >
            {section.bodyMd}
          </ReactMarkdown>
        </section>
      ))}
    </article>
  );
}
