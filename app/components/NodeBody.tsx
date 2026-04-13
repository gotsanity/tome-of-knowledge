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
      <article className="prose-manuscript">
        <ReactMarkdown remarkPlugins={plugins as never} components={components}>
          {bodyMd}
        </ReactMarkdown>
      </article>
    );
  }

  return (
    <article className="prose-manuscript space-y-10">
      {sections.map((section) => (
        <section key={`${section.order}-${section.heading}`}>
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
