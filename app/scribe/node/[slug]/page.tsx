import { notFound } from "next/navigation";
import { AppShell } from "@/app/components";
import { ScribeDesk } from "@/app/scribe/ScribeDesk";
import { db, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { listLexiconTerms } from "@/lib/vault/loaders";
import { loadScribeSubject } from "@/lib/vault/scribe";
import type { Viewer } from "@/lib/vault/can-see";

export default async function ScribeNodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getSessionUser();
  const viewer: Viewer = user ? { role: user.role } : null;

  const subject = await loadScribeSubject(db, "node", slug, viewer);
  if (!subject) notFound();

  const [allNodes, allLexiconTerms] = await Promise.all([
    db
      .select({ slug: schema.nodes.slug, name: schema.nodes.name })
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

  return (
    <AppShell active="scribe">
      <ScribeDesk
        subject={subject}
        wikilinks={wikilinks}
        lexiconTooltips={lexiconTooltips}
      />
    </AppShell>
  );
}
