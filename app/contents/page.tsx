import Link from "next/link";
import { AppShell } from "../components";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-helpers";
import { listNodesByType, type LoadedNode } from "@/lib/vault/loaders";
import { CATEGORY_META } from "@/lib/vault/categories";
import { NODE_TYPES } from "@/lib/db/schema";
import type { Viewer } from "@/lib/vault/can-see";

const ROMAN_NUMERALS = [
  "I.",
  "II.",
  "III.",
  "IV.",
  "V.",
  "VI.",
  "VII.",
  "VIII.",
  "IX.",
  "X.",
  "XI.",
  "XII.",
  "XIII.",
  "XIV.",
  "XV.",
];

function displayName(node: LoadedNode): string {
  const raw = node.name;
  if (/\s/.test(raw) || /[A-Z]/.test(raw)) return raw;
  return raw
    .split("-")
    .filter((s) => s.length > 0)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function LedgerRow({ node }: { node: LoadedNode }) {
  return (
    <li className="group flex items-end">
      <Link
        href={`/node/${node.slug}`}
        className="text-lg text-on-surface group-hover:text-primary transition-colors duration-300"
      >
        {displayName(node)}
      </Link>
      <span className="leader-dots" />
      <span className="italic text-primary/60 text-sm uppercase tracking-widest">
        {node.visibility === "published" ? "open" : node.visibility}
      </span>
    </li>
  );
}

export default async function TableOfContentsPage() {
  const user = await getSessionUser();
  const viewer: Viewer = user ? { role: user.role } : null;

  const sections = await Promise.all(
    NODE_TYPES.map(async (type) => ({
      type,
      label: CATEGORY_META[type].label,
      nodes: await listNodesByType(db, type, viewer),
    })),
  );
  const populated = sections.filter((s) => s.nodes.length > 0);

  return (
    <AppShell active="contents">
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
            The Universal Index
          </h1>
          <p className="italic text-primary/80 text-xl">
            Chronicles of the Known and Forbidden
          </p>
          <div className="mt-8 flex justify-center items-center gap-4">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-primary/40" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-outline">
              <span>
                {populated.reduce((acc, s) => acc + s.nodes.length, 0)} entries
              </span>
              <span className="mx-2">•</span>
              <span>{populated.length} sections</span>
            </span>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-primary/40" />
          </div>
        </header>

        {populated.length === 0 ? (
          <p className="text-center italic text-on-surface-variant py-24">
            The archive stands empty. Run{" "}
            <code className="text-primary">npm run vault:import</code> to seed
            it.
          </p>
        ) : (
          <div className="space-y-12">
            {populated.map((section, idx) => (
              <section key={section.type} id={section.type} className="scroll-mt-32">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-primary text-4xl font-bold leading-none">
                    {ROMAN_NUMERALS[idx] ?? `${idx + 1}.`}
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                    {section.label}
                  </h2>
                  <div className="flex-grow h-px bg-primary/20" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-outline">
                    {section.nodes.length}{" "}
                    {section.nodes.length === 1 ? "entry" : "entries"}
                  </span>
                </div>
                <ul className="space-y-4">
                  {section.nodes
                    .slice()
                    .sort((a, b) =>
                      displayName(a).localeCompare(displayName(b)),
                    )
                    .map((node) => (
                      <LedgerRow key={node.slug} node={node} />
                    ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <footer className="mt-24 border-t border-outline-variant/40 pt-12 flex flex-col items-center">
          <div className="mb-6 flex gap-4 text-outline">
            <span className="material-symbols-outlined text-sm" aria-hidden>
              history_edu
            </span>
            <span className="material-symbols-outlined text-sm" aria-hidden>
              auto_stories
            </span>
            <span className="material-symbols-outlined text-sm" aria-hidden>
              menu_book
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.5em] text-outline mb-2">
            END OF INDEX
          </p>
          <div className="w-1 h-1 bg-primary/40 rounded-full" />
        </footer>
      </div>
    </AppShell>
  );
}
