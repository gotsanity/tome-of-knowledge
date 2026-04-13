import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/app/components";
import { NodeHeader } from "@/app/components/NodeHeader";
import { NodeBody } from "@/app/components/NodeBody";
import { db, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  getNode,
  getRelated,
  listLexiconTerms,
  getCompanion,
} from "@/lib/vault/loaders";
import type { Viewer } from "@/lib/vault/can-see";

export default async function NodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getSessionUser();
  const viewer: Viewer = user ? { role: user.role } : null;

  const node = await getNode(db, slug, viewer);
  if (!node) {
    notFound();
  }

  const related = await getRelated(db, slug, viewer);
  const companion = await getCompanion(db, slug, viewer);

  const [allNodes, allLexiconTerms] = await Promise.all([
    db.select({ slug: schema.nodes.slug }).from(schema.nodes),
    listLexiconTerms(db),
  ]);
  const wikilinks = {
    nodeSlugs: new Set(allNodes.map((r) => r.slug)),
    lexiconSlugs: new Set(allLexiconTerms.map((t) => t.slug)),
  };
  const lexiconTooltips = {
    terms: allLexiconTerms.map((t) => ({
      slug: t.slug,
      term: t.term,
      aliases: t.aliases,
      tooltipEnabled: t.tooltipEnabled,
    })),
  };

  return (
    <AppShell active="library">
      <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-12 parchment-texture">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <NodeHeader node={node} />
            <NodeBody
              sections={node.sections}
              bodyMd={node.bodyMd}
              wikilinks={wikilinks}
              lexiconTooltips={lexiconTooltips}
            />

            {companion && (
              <section
                aria-labelledby="gm-notes-heading"
                className="mt-16 border border-outline-variant/30 bg-surface-container-high/40 backdrop-blur-sm p-8 rounded"
              >
                <header className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/30">
                  <span
                    className="material-symbols-outlined text-primary"
                    aria-hidden
                  >
                    visibility
                  </span>
                  <div>
                    <span className="block text-[10px] uppercase tracking-[0.3em] text-outline">
                      GM Only
                    </span>
                    <h2
                      id="gm-notes-heading"
                      className="text-xl font-bold text-primary uppercase tracking-[0.15em]"
                    >
                      GM Notes
                    </h2>
                  </div>
                </header>
                <NodeBody
                  sections={companion.sections}
                  bodyMd={companion.bodyMd}
                  wikilinks={wikilinks}
                  lexiconTooltips={lexiconTooltips}
                />
              </section>
            )}
          </div>
          <aside className="lg:col-span-4">
            {related.length > 0 && (
              <div className="sticky top-24">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-4">
                  Related
                </h2>
                <ul className="space-y-3">
                  {related.map((edge) => (
                    <li
                      key={`${edge.direction}-${edge.slug}-${edge.relType}`}
                      className="flex items-baseline justify-between gap-4 border-b border-outline-variant/40 pb-2"
                    >
                      <Link
                        href={`/node/${edge.slug}`}
                        className="text-on-surface hover:text-primary transition-colors"
                      >
                        {edge.name}
                      </Link>
                      <span className="text-[10px] uppercase tracking-widest text-outline">
                        {edge.relType.replace(/_/g, " ").toLowerCase()}
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
