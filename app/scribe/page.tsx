import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { AppShell } from "../components";
import { db, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";

/**
 * Scribe landing — a subject picker for GMs. Lists app-editable pages and
 * recently-touched app-authored nodes. Non-GMs receive a plain 404, matching
 * the zero-trust pattern used elsewhere.
 */
export default async function ScribeLandingPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "gm") notFound();

  const [pages, appNodes] = await Promise.all([
    db
      .select({
        slug: schema.pages.slug,
        title: schema.pages.title,
        updatedAt: schema.pages.updatedAt,
      })
      .from(schema.pages)
      .orderBy(desc(schema.pages.updatedAt)),
    db
      .select({
        slug: schema.nodes.slug,
        name: schema.nodes.name,
        type: schema.nodes.type,
        updatedAt: schema.nodes.updatedAt,
      })
      .from(schema.nodes)
      .where(eq(schema.nodes.sourcePath, ""))
      .orderBy(desc(schema.nodes.updatedAt))
      .limit(20),
  ]);

  return (
    <AppShell active="scribe">
      <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-12">
        <header className="mb-12 border-b border-primary/10 pb-6">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-2 block">
            Scribe Desk
          </span>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter leading-none mb-2">
            Pick a subject
          </h1>
          <p className="text-on-surface-variant italic">
            Pages you authored and recently touched app-side nodes.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-4">
              Pages
            </h3>
            {pages.length === 0 ? (
              <p className="text-on-surface-variant italic">No pages yet.</p>
            ) : (
              <ul className="space-y-2">
                {pages.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/scribe/page/${p.slug}`}
                      className="block border border-outline-variant/30 bg-surface-container-high/40 hover:bg-surface-container-high/80 px-4 py-3 rounded-sm transition-colors"
                    >
                      <span className="block text-on-surface font-bold">
                        {p.title}
                      </span>
                      <span className="block text-[11px] uppercase tracking-widest text-outline">
                        {p.slug}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-4">
              App-authored nodes
            </h3>
            {appNodes.length === 0 ? (
              <p className="text-on-surface-variant italic">
                No app-authored nodes yet. Vault-imported nodes are read-only
                here until the diff-export pipeline lands.
              </p>
            ) : (
              <ul className="space-y-2">
                {appNodes.map((n) => (
                  <li key={n.slug}>
                    <Link
                      href={`/scribe/node/${n.slug}`}
                      className="block border border-outline-variant/30 bg-surface-container-high/40 hover:bg-surface-container-high/80 px-4 py-3 rounded-sm transition-colors"
                    >
                      <span className="block text-on-surface font-bold">
                        {n.name}
                      </span>
                      <span className="block text-[11px] uppercase tracking-widest text-outline">
                        {n.type} · {n.slug}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
