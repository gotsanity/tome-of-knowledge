import Link from "next/link";
import {
  AppShell,
  Button,
  CategoryIndex,
  LandingFooterActions,
  ShowcaseBento,
} from "./components";
import type { CategoryIndexItem } from "./components";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { listCategoryCounts, getSiteStats } from "@/lib/vault/loaders";
import { CATEGORY_META } from "@/lib/vault/categories";
import type { Viewer } from "@/lib/vault/can-see";

export default async function Home() {
  const user = await getSessionUser();
  const viewer: Viewer = user ? { role: user.role } : null;
  const [rawCategories, siteStats] = await Promise.all([
    listCategoryCounts(db, viewer),
    getSiteStats(db),
  ]);
  const categories = rawCategories
    .slice()
    .sort((a, b) =>
      CATEGORY_META[a.type].letter.localeCompare(CATEGORY_META[b.type].letter),
    );
  const categoryItems: CategoryIndexItem[] = categories.map(({ type }) => {
    const meta = CATEGORY_META[type];
    return {
      href: `/contents#${type}`,
      letter: meta.letter,
      label: meta.label,
      blurb: meta.blurb,
    };
  });

  const featuredTile = (
    <article className="bg-stone-900/40 p-1 border border-stone-800 group hover:border-primary/30 transition-all">
      <div className="relative overflow-hidden min-h-[400px] h-full">
        <div className="w-full h-full bg-gradient-to-br from-stone-800 via-stone-900 to-black group-hover:scale-105 transition-transform duration-700 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8">
          <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">
            Topical Spotlight
          </span>
          <h3 className="text-4xl font-bold text-on-surface mb-4">
            The Fall of Ironcrest
          </h3>
          <p className="text-stone-400 line-clamp-2 max-w-lg mb-6">
            A detailed account of the cataclysm that ended the Dwarven Hegemony
            in the year 442 of the Second Age.
          </p>
          <Link
            href="/entry"
            className="inline-flex items-center gap-2 text-primary uppercase text-xs font-bold tracking-widest hover:underline decoration-1 underline-offset-4"
          >
            Read Full Manuscript{" "}
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </article>
  );

  const spindleTile = (
    <article className="bg-stone-900/40 border border-stone-800 p-8 hover:border-primary/30 transition-all flex flex-col justify-center">
      <span className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-2">
        Category: Artifacts
      </span>
      <h4 className="text-2xl font-bold mb-3 text-on-surface italic">
        The Weaver&apos;s Spindle
      </h4>
      <p className="text-stone-500 text-sm leading-relaxed mb-4">
        An obsidian relic whispered to hold the threads of fate itself. Found
        in the shifting sands of Pelia.
      </p>
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-stone-800/50">
        <span className="text-[10px] text-stone-600 italic">
          Last edited 3 days ago
        </span>
        <span className="material-symbols-outlined text-stone-600">
          bookmark
        </span>
      </div>
    </article>
  );

  const elixirsTile = (
    <article className="bg-stone-900/40 border border-stone-800 p-8 hover:border-primary/30 transition-all flex flex-col justify-center">
      <span className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-2">
        Category: Alchemy
      </span>
      <h4 className="text-2xl font-bold mb-3 text-on-surface italic">
        Void-Tinted Elixirs
      </h4>
      <p className="text-stone-500 text-sm leading-relaxed mb-4">
        A compilation of dangerous drafts extracted from the journals of the
        Renegade Alchemist, Malakor.
      </p>
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-stone-800/50">
        <span className="text-[10px] text-stone-600 italic">
          Restricted Access
        </span>
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          lock
        </span>
      </div>
    </article>
  );

  const stats = [
    {
      icon: "history_edu",
      value: siteStats.totalNodes,
      label: "Manuscripts Filed",
    },
    {
      icon: "public",
      value: siteStats.mappedPlaces,
      label: "Mapped Regions",
    },
    {
      icon: "translate",
      value: siteStats.lexiconTerms,
      label: "Lexicon Entries",
    },
    {
      icon: "history",
      value: siteStats.eventsRecorded,
      label: "Events Recorded",
    },
  ];

  return (
    <AppShell active="library">
      {/* Hero Section */}
      <section className="relative min-h-[720px] flex flex-col items-center overflow-hidden border-b border-primary/10">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-stone-950/60" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-4xl px-8 py-16">
          <div className="inline-block px-4 py-1 mb-6 border-y border-primary/30">
            <span className="text-xs uppercase tracking-[0.4em] text-primary font-bold">
              Forgotten Chronicles
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-on-surface mb-8 tracking-tighter leading-tight italic">
            The Grand Library of Oakhaven
          </h1>
          <p className="text-xl md:text-2xl text-stone-400 leading-relaxed max-w-2xl mx-auto font-light">
            Explore the collected wisdom of five ages, preserved within these
            ink-washed halls. Every scroll tells a story, every map marks a
            destiny.
          </p>
          <div className="mt-12 flex justify-center gap-6">
            <Link href="/contents">
              <Button variant="primary">Explore Records</Button>
            </Link>
            <Button variant="secondary">World Atlas</Button>
          </div>
        </div>
        <a
          href="#library"
          aria-label="Scroll to the Library section"
          className="relative z-10 pb-8 flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60"
        >
          <span className="text-[10px] uppercase tracking-widest text-primary">
            Scroll to Descend
          </span>
          <span className="material-symbols-outlined animate-bounce text-primary">
            keyboard_double_arrow_down
          </span>
        </a>
      </section>

      {/* Library Section — Bento Grid */}
      <section
        id="library"
        className="scroll-mt-24 max-w-[1400px] mx-auto px-12 py-24"
      >
        <ShowcaseBento
          title="The Library"
          featured={featuredTile}
          secondaries={[spindleTile, elixirsTile]}
        />
        <CategoryIndex items={categoryItems} />
      </section>

      {/* Statistics Footer Section */}
      <section className="bg-stone-950 border-t border-stone-800/50 pt-16">
        <div className="max-w-[1400px] mx-auto px-12">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {stats.map(({ icon, value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-primary mb-4 text-4xl"
                >
                  {icon}
                </span>
                <dd className="text-4xl font-black text-on-surface mb-2">
                  {value.toLocaleString("en-US")}
                </dd>
                <dt className="text-[10px] uppercase tracking-[0.4em] text-on-surface-variant font-bold">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative mt-20 pt-12 pb-16 px-12 border-t border-stone-900 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-left">
            <div className="text-xl font-bold text-primary italic mb-2">
              Tome of Knowledge
            </div>
            <p className="text-stone-500 text-sm max-w-xs">
              A community-driven chronicle of the worlds we build and the
              stories we weave. All rights reserved to the Great Library.
            </p>
          </div>
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-8">
            {["Privacy Scroll", "Library Rules", "Contact Archivist"].map(
              (label) => (
                <a
                  key={label}
                  href="#"
                  className="text-stone-500 hover:text-primary transition-colors uppercase tracking-widest text-[10px] font-bold"
                >
                  {label}
                </a>
              ),
            )}
          </div>
          <div className="flex md:hidden gap-8">
            {["Privacy Scroll", "Library Rules", "Contact Archivist"].map(
              (label) => (
                <a
                  key={label}
                  href="#"
                  className="text-stone-500 hover:text-primary transition-colors uppercase tracking-widest text-[10px] font-bold"
                >
                  {label}
                </a>
              ),
            )}
          </div>
          <LandingFooterActions />
        </div>
      </section>
    </AppShell>
  );
}
