import Link from "next/link";
import { AppShell } from "../components";

type LedgerEntry = { title: string; page: string };
type LedgerSection = {
  numeral: string;
  heading: string;
  columns?: boolean;
  entries: LedgerEntry[];
};

const SECTIONS: LedgerSection[] = [
  {
    numeral: "I.",
    heading: "Origins and Foundations",
    entries: [
      { title: "The Scribe's First Invocation", page: "004" },
      { title: "Mapping the Ether-Void", page: "012" },
      { title: "The Covenant of Seven Seals", page: "029" },
    ],
  },
  {
    numeral: "II.",
    heading: "Creatures of the Gloom",
    columns: true,
    entries: [
      { title: "Whispering Stags", page: "045" },
      { title: "Obsidian Drakes", page: "058" },
      { title: "Marrow-Wights", page: "072" },
      { title: "The Unseen Hive", page: "089" },
    ],
  },
  {
    numeral: "III.",
    heading: "Forbidden Arts & Alchemy",
    entries: [
      { title: "Silver-Tongued Toxins", page: "112" },
      { title: "Rites of the Solar Eclipse", page: "125" },
      { title: "The Transmutation of Sorrow", page: "148" },
      { title: "Vesper's Guide to Star-Falling", page: "161" },
    ],
  },
];

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  return (
    <li className="group flex items-end">
      <Link
        href="/entry"
        className="text-lg text-stone-300 group-hover:text-primary transition-colors duration-300"
      >
        {entry.title}
      </Link>
      <span className="leader-dots" />
      <span className="italic text-primary/60">{entry.page}</span>
    </li>
  );
}

export default function TableOfContentsPage() {
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
            >
              <path
                d="M0 10C10 10 15 0 20 0C25 0 30 10 40 10C30 10 25 20 20 20C15 20 10 10 0 10Z"
                fill="#d4af37"
                fillOpacity="0.3"
              />
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
            <span className="text-[10px] uppercase tracking-[0.4em] text-stone-500">
              Volume XIV • Second Era
            </span>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-primary/40" />
          </div>
        </header>

        <div className="space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.numeral}>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-primary text-4xl font-bold leading-none">
                  {section.numeral}
                </span>
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                  {section.heading}
                </h2>
                <div className="flex-grow h-px bg-primary/20" />
              </div>
              {section.columns ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  {[0, 1].map((col) => (
                    <ul key={col} className="space-y-4">
                      {section.entries
                        .filter((_, i) => i % 2 === col)
                        .map((entry) => (
                          <LedgerRow key={entry.title} entry={entry} />
                        ))}
                    </ul>
                  ))}
                </div>
              ) : (
                <ul className="space-y-4">
                  {section.entries.map((entry) => (
                    <LedgerRow key={entry.title} entry={entry} />
                  ))}
                </ul>
              )}
            </section>
          ))}

          {/* Featured Plate Asymmetric Element */}
          <div className="py-12 flex flex-col md:flex-row gap-10 items-center">
            <div className="w-full md:w-1/2 p-1 border border-primary/20 bg-stone-900 shadow-xl">
              <div className="border border-primary/10 p-2">
                <div className="w-full h-64 bg-gradient-to-br from-stone-800 via-stone-900 to-black grayscale brightness-75 hover:grayscale-0 transition-all duration-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary/40 text-7xl">
                    auto_stories
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              <span className="text-primary font-bold text-[10px] tracking-[0.3em] uppercase">
                Marginalia Note
              </span>
              <p className="italic text-stone-400 text-lg leading-relaxed">
                &ldquo;The ink used for this volume was distilled from the
                midnight petals of the Gloom-Rose, ensuring the words never
                fade, even when the stars eventually do.&rdquo;
              </p>
              <p className="text-stone-500 text-xs">
                — Archivist Kaelen, 432 AC
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-24 border-t border-primary/20 pt-12 flex flex-col items-center">
          <div className="mb-6 flex gap-4 text-stone-600">
            <span className="material-symbols-outlined text-sm">
              history_edu
            </span>
            <span className="material-symbols-outlined text-sm">
              auto_stories
            </span>
            <span className="material-symbols-outlined text-sm">menu_book</span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.5em] text-stone-600 mb-2">
            END OF INDEX
          </p>
          <div className="w-1 h-1 bg-primary/40 rounded-full" />
        </footer>
      </div>
    </AppShell>
  );
}
