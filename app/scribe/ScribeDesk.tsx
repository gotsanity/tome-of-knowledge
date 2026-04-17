import { Button } from "../components/Button";
import { NodeBody } from "../components/NodeBody";
import type { ScribeSubject } from "@/lib/vault/scribe";
import type { WikilinksOptions } from "@/lib/vault/remark-wikilinks";
import type { LexiconTooltipsOptions } from "@/lib/vault/remark-lexicon-tooltips";

type Props = {
  subject: ScribeSubject;
  wikilinks: WikilinksOptions;
  lexiconTooltips: LexiconTooltipsOptions;
};

/**
 * The parchment desk shell. Reads a ScribeSubject and renders its bodyMd via
 * the shared NodeBody markdown pipeline (wikilinks + lexicon tooltips). The
 * editor toolbar and save affordances are scaffolded but inert — save/export
 * is a later phase. The `origin` footer field is the forward hook for that
 * work: vault-origin edits will route through a diff journal, app-origin
 * edits will persist directly.
 */
export function ScribeDesk({ subject, wikilinks, lexiconTooltips }: Props) {
  const updated = subject.updatedAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-12">
      <header className="flex justify-between items-end mb-12 border-b border-primary/10 pb-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-2 block">
            {subject.kind === "node" ? "Node" : "Page"} · {subject.slug}
          </span>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter leading-none mb-2">
            {subject.name}
          </h1>
          <p className="text-stone-500 italic">Last updated {updated}</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            size="sm"
            icon="history"
            disabled
            title="Edits are not yet persisted — save/diff lands in a later phase"
          >
            Drafts
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="workspace_premium"
            disabled
            title="Edits are not yet persisted — save/diff lands in a later phase"
          >
            Seal &amp; Save
          </Button>
        </div>
      </header>

      <section className="bg-stone-900/40 border border-primary/5 p-12 lg:p-20 parchment-glow min-h-[819px] relative">
        <div className="absolute top-4 left-4 text-primary/20">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor">
            <path d="M0 0h2v40H0zM0 0h40v2H0z" />
            <circle cx="20" cy="20" r="2" />
          </svg>
        </div>
        <div className="absolute bottom-4 right-4 text-primary/20 rotate-180">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor">
            <path d="M0 0h2v40H0zM0 0h40v2H0z" />
            <circle cx="20" cy="20" r="2" />
          </svg>
        </div>

        {/* contentEditable WYSIWYG. Edits are not persisted — save/diff is a
            later phase. NodeBody renders the initial markdown; the browser
            takes over once the article mounts. */}
        <article
          className="prose prose-invert max-w-none outline-none focus-visible:ring-1 focus-visible:ring-primary/40 rounded-sm"
          contentEditable
          suppressContentEditableWarning
          spellCheck
        >
          <NodeBody
            sections={subject.sections}
            bodyMd={subject.bodyMd}
            wikilinks={wikilinks}
            lexiconTooltips={lexiconTooltips}
          />
        </article>
      </section>

      <footer className="mt-12 flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.2em] text-stone-600">
        <div className="flex space-x-6">
          <span>
            Origin:{" "}
            <span data-testid="scribe-origin" className="text-primary">
              {subject.origin}
            </span>
          </span>
          <span>Kind: {subject.kind}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-primary/40" />
          <span>Edits not yet persisted</span>
        </div>
      </footer>
    </div>
  );
}
