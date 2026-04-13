import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AppShell } from "@/app/components";
import { db } from "@/lib/db";
import { getLexiconTerm, listLexiconTerms } from "@/lib/vault/loaders";
import { normalizeSlug } from "@/lib/vault/slug";

export default async function LexiconTermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const term = await getLexiconTerm(db, slug);
  if (!term) {
    notFound();
  }

  const allTerms = await listLexiconTerms(db);
  const bySlug = new Map(allTerms.map((t) => [t.slug, t]));
  const related = term.relatedTerms
    .map((label) => bySlug.get(normalizeSlug(label)))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  return (
    <AppShell active="library">
      <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-12 parchment-texture">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <header className="mb-12">
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-4 block">
                Lexicon · {term.domain}
              </span>
              <h1 className="text-5xl lg:text-6xl font-black text-on-surface tracking-tighter leading-tight mb-6">
                {term.term}
              </h1>
              {term.aliases.length > 0 && (
                <div className="flex flex-wrap gap-4 border-b border-outline-variant/40 pb-6 italic text-on-surface-variant">
                  <span className="text-[10px] not-italic uppercase tracking-[0.2em] text-outline">
                    Also known as
                  </span>
                  <span>{term.aliases.join(", ")}</span>
                </div>
              )}
            </header>

            <article className="prose-manuscript space-y-10">
              <section>
                <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-primary/90 mb-4">
                  Definition
                </h2>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {term.definition}
                </ReactMarkdown>
              </section>

              {term.usage && (
                <section>
                  <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-primary/90 mb-4">
                    Usage
                  </h2>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {term.usage}
                  </ReactMarkdown>
                </section>
              )}

              {term.notes && (
                <section>
                  <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-primary/90 mb-4">
                    Notes
                  </h2>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {term.notes}
                  </ReactMarkdown>
                </section>
              )}
            </article>
          </div>

          <aside className="lg:col-span-4">
            {related.length > 0 && (
              <div className="sticky top-24">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-4">
                  Related Terms
                </h2>
                <ul className="space-y-3">
                  {related.map((rel) => (
                    <li
                      key={rel.slug}
                      className="flex items-baseline justify-between gap-4 border-b border-outline-variant/40 pb-2"
                    >
                      <Link
                        href={`/lexicon/${rel.slug}`}
                        className="text-on-surface hover:text-primary transition-colors"
                      >
                        {rel.term}
                      </Link>
                      <span className="text-[10px] uppercase tracking-widest text-outline">
                        {rel.domain}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
