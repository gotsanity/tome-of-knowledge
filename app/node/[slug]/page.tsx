import { notFound } from "next/navigation";
import { AppShell } from "@/app/components";
import { NodeHeader } from "@/app/components/NodeHeader";
import { NodeBody } from "@/app/components/NodeBody";
import { Marginalia } from "@/app/components/Marginalia";
import {
  LinkedRecords,
  computeLinkedRecords,
} from "@/app/components/LinkedRecords";
import { NodeTagline, resolveTagline } from "@/app/components/NodeTagline";
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
  const viewerIsGm = user?.role === "gm";

  const node = await getNode(db, slug, viewer);
  if (!node) {
    notFound();
  }

  const related = await getRelated(db, slug, viewer);
  const companion = await getCompanion(db, slug, viewer);

  const [allNodes, allLexiconTerms] = await Promise.all([
    db
      .select({
        slug: schema.nodes.slug,
        name: schema.nodes.name,
      })
      .from(schema.nodes),
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
  const nodeMetaBySlug = new Map(
    allNodes.map((r) => [r.slug, { slug: r.slug, name: r.name }]),
  );

  const tagline = resolveTagline(node, allLexiconTerms);
  const linkedRecords = computeLinkedRecords(
    node,
    related,
    nodeMetaBySlug,
    viewerIsGm,
  );

  return (
    <AppShell active="contents" currentNodeSlug={slug}>
      <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-12 parchment-texture">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <NodeHeader node={node} />
            {tagline && (
              <div className="border-b border-primary/10 pb-8 mb-12">
                <NodeTagline text={tagline} />
              </div>
            )}
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
            <div className="sticky top-24 space-y-8">
              <Marginalia
                node={node}
                viewerIsGm={viewerIsGm}
                nodeSlugs={wikilinks.nodeSlugs}
              />
              <LinkedRecords entries={linkedRecords} />
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
