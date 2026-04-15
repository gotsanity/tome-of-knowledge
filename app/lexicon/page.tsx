import Link from "next/link";
import { AppShell, NodeBlock } from "@/app/components";
import { db } from "@/lib/db";
import { listLexiconTerms, type LoadedLexiconTerm } from "@/lib/vault/loaders";

type LetterGroup = {
  letter: string;
  terms: LoadedLexiconTerm[];
};

function groupByLetter(terms: LoadedLexiconTerm[]): LetterGroup[] {
  const sorted = [...terms].sort((a, b) =>
    a.term.localeCompare(b.term, undefined, { sensitivity: "base" }),
  );
  const groups = new Map<string, LoadedLexiconTerm[]>();
  for (const term of sorted) {
    const first = term.term.trim().charAt(0).toUpperCase();
    const key = /[A-Z]/.test(first) ? first : "#";
    const bucket = groups.get(key) ?? [];
    bucket.push(term);
    groups.set(key, bucket);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, termsForLetter]) => ({ letter, terms: termsForLetter }));
}

function firstSentence(markdown: string): string {
  const cleaned = markdown
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const match = cleaned.match(/^(.+?[.!?])(\s|$)/);
  const snippet = match ? match[1] : cleaned;
  return snippet.length > 240 ? `${snippet.slice(0, 237)}…` : snippet;
}

export const metadata = {
  title: "Lexicon · Tome of Knowledge",
};

export default async function LexiconIndexPage() {
  const terms = await listLexiconTerms(db);
  const groups = groupByLetter(terms);

  return (
    <AppShell active="lexicon">
      <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-12">
        <header className="text-center mb-16 relative">
          <div className="inline-block mb-4">
            <svg
              width="40"
              height="20"
              viewBox="0 0 40 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="fill-primary/30"
            >
              <path d="M0 10C10 10 15 0 20 0C25 0 30 10 40 10C30 10 25 20 20 20C15 20 10 10 0 10Z" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-on-surface tracking-tighter mb-4">
            The Lexicon
          </h1>
          <p className="italic text-primary/80 text-xl">
            A Compendium of Terms and Their Meanings
          </p>
          <div className="mt-8 flex justify-center items-center gap-4">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-primary/40" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-outline">
              <span>{terms.length} entries</span>
              <span className="mx-2">•</span>
              <span>{groups.length} sections</span>
            </span>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-primary/40" />
          </div>
        </header>

        {groups.length === 0 ? (
          <p className="text-center italic text-on-surface-variant py-24">
            The lexicon is empty. Run{" "}
            <code className="text-primary">npm run vault:import</code> to seed
            it.
          </p>
        ) : (
          <>
            <nav
              aria-label="Lexicon alphabet index"
              className="mb-12 flex flex-wrap justify-center gap-2 border-y border-outline-variant/40 py-4"
            >
              {groups.map((g) => (
                <a
                  key={g.letter}
                  href={`#letter-${g.letter}`}
                  className="w-9 h-9 flex items-center justify-center text-sm font-bold text-on-surface-variant hover:text-primary hover:bg-primary/10 border border-outline-variant/30 transition-colors"
                >
                  {g.letter}
                </a>
              ))}
            </nav>

            <div className="space-y-16">
              {groups.map((group) => (
                <section
                  key={group.letter}
                  id={`letter-${group.letter}`}
                  className="scroll-mt-24"
                >
                  <div className="flex items-baseline gap-6 mb-8 border-b border-outline-variant/40 pb-4">
                    <h2 className="text-5xl font-black text-primary/80 tracking-tighter">
                      {group.letter}
                    </h2>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-outline">
                      {group.terms.length}{" "}
                      {group.terms.length === 1 ? "entry" : "entries"}
                    </span>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    {group.terms.map((term) => (
                      <Link
                        key={term.slug}
                        href={`/lexicon/${term.slug}`}
                        data-lexicon-entry
                        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      >
                        <NodeBlock
                          label={
                            <span className="text-base normal-case tracking-normal text-on-surface group-hover:text-primary transition-colors">
                              {term.term}
                            </span>
                          }
                          chip={
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-[9px] uppercase tracking-widest text-primary font-bold">
                              {term.domain}
                            </span>
                          }
                          className="h-full group-hover:bg-primary/10 group-hover:border-primary transition-colors"
                        >
                          {term.aliases.length > 0 && (
                            <p className="text-xs not-italic text-outline mb-2">
                              Also: {term.aliases.join(", ")}
                            </p>
                          )}
                          <p className="not-italic">
                            {firstSentence(term.definition)}
                          </p>
                        </NodeBlock>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}

        <footer className="mt-24 border-t border-outline-variant/40 pt-12 flex flex-col items-center">
          <div className="mb-6 flex gap-4 text-outline">
            <span className="material-symbols-outlined text-sm" aria-hidden>
              history_edu
            </span>
            <span className="material-symbols-outlined text-sm" aria-hidden>
              menu_book
            </span>
            <span className="material-symbols-outlined text-sm" aria-hidden>
              auto_stories
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.5em] text-outline mb-2">
            END OF LEXICON
          </p>
          <div className="w-1 h-1 bg-primary/40 rounded-full" />
        </footer>
      </div>
    </AppShell>
  );
}
