import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LoadedSection } from "@/lib/vault/loaders";

type Props = {
  sections: LoadedSection[];
  bodyMd: string;
};

/**
 * Renders a node's body as plain markdown for step 5. Wikilink rewriting and
 * lexicon tooltips land in later steps via custom remark plugins on the same
 * pipeline.
 */
export function NodeBody({ sections, bodyMd }: Props) {
  if (sections.length === 0) {
    return (
      <article className="prose-manuscript">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyMd}</ReactMarkdown>
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
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {section.bodyMd}
          </ReactMarkdown>
        </section>
      ))}
    </article>
  );
}
