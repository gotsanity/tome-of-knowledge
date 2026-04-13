import Link from "next/link";
import { AppShell } from "../components";

const TAGS = ["Chronology", "Forbidden Lore", "Obsidian Vellum"];

const METADATA: Array<{ label: string; value: string; italic?: boolean }> = [
  { label: "Catalog Number", value: "ARC-VOID-0882" },
  { label: "Material Composition", value: "Ether-treated Obsidian Slat" },
  { label: "Condition", value: "Ethereally Unstable", italic: true },
];

const LINKED_RECORDS = [
  { title: "The Weaver's Paradox", kind: "Draft Fragment" },
  { title: "Mapping the Silent Isles", kind: "Cartographic Entry" },
];

export default function EntryDetailPage() {
  return (
    <AppShell active="library">
      <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-12 parchment-texture">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Text Column */}
          <div className="lg:col-span-8">
            <header className="mb-12 text-center lg:text-left">
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-4 block">
                Manuscript Fragment #882
              </span>
              <h1 className="text-5xl lg:text-6xl font-black text-on-surface tracking-tighter leading-tight mb-6">
                The Obsidian Vellum and the Lost Script
              </h1>
              <div className="flex items-center justify-center lg:justify-start gap-4 text-stone-500 italic border-b border-primary/10 pb-8">
                <span>Recovered from the Silent Isles</span>
                <span className="text-primary/40">⬥</span>
                <span>Circa Fourth Era</span>
              </div>
            </header>

            <article className="space-y-8 text-stone-300 leading-[1.8] text-lg">
              <p className="drop-cap">
                In the heart of the great library, where the shadows pool like
                spilt ink, lies the vault of the Obsidian Vellum. It is said
                that the pages were not crafted from sheepskin or papyrus, but
                woven from the distilled darkness of a moonless night. The
                script is etched in a gold so pure it seems to bleed light
                into the surrounding gloom.
              </p>
              <p>
                Scholars have spent centuries attempting to decipher the
                rhythmic curves of the{" "}
                <span className="italic text-primary/80 font-semibold">
                  Ochre Sigils
                </span>
                . To look upon them is to feel a phantom weight against the
                soul, as if the history of ten thousand years is pressing into
                the retina. The ink, peculiar and sentient, shifts its
                alignment depending on the temperament of the reader.
              </p>

              <div className="my-12 relative">
                <div className="absolute -left-4 -right-4 top-1/2 border-t border-primary/20" />
                <div className="relative flex justify-center">
                  <span className="bg-background px-4">
                    <svg
                      className="fill-primary/40"
                      width="40"
                      height="20"
                      viewBox="0 0 40 20"
                    >
                      <path d="M0 10 L15 10 L20 0 L25 10 L40 10 L25 10 L20 20 L15 10 Z" />
                    </svg>
                  </span>
                </div>
              </div>

              <p>
                <span className="font-bold text-on-surface">
                  &ldquo;The First Scribe did not write,&rdquo;
                </span>{" "}
                the fragment reads,{" "}
                <span className="italic">
                  &ldquo;he simply invited the void to speak.&rdquo;
                </span>{" "}
                This paradox forms the foundation of modern calligraphy within
                the Ink Order. Every stroke is an invitation, every flourish a
                boundary drawn against the encroaching silence of the
                forgotten ages.
              </p>

              <div className="grid grid-cols-2 gap-4 my-10">
                {["history_edu", "menu_book"].map((icon) => (
                  <div
                    key={icon}
                    className="p-1 border border-primary/20 bg-stone-900/40 rounded-sm"
                  >
                    <div className="w-full h-64 bg-gradient-to-br from-stone-800 via-stone-900 to-black grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary/30 text-7xl">
                        {icon}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p>
                Beyond the aesthetic allure, the Vellum serves as a repository
                for the{" "}
                <span className="border-b border-primary/30 pb-0.5">
                  Chronicles of Ash
                </span>
                . These accounts detail the rise and subsequent fall of
                civilizations that predated the written word itself. To touch
                the vellum is to invite a fever of visions—the smell of
                burning cedar, the sound of a thousand bells, the taste of
                copper.
              </p>
              <p>
                The Archivist remains the sole guardian of the key to the
                glass case. It is a heavy thing of brass and iron, worn smooth
                by the grip of those who understood that knowledge is not
                merely power, but a heavy burden upon the spirit.
              </p>
            </article>

            <footer className="mt-16 pt-8 border-t border-primary/10 flex flex-wrap gap-4">
              {TAGS.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-widest text-primary font-bold rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </footer>
          </div>

          {/* Marginalia / Metadata Column */}
          <div className="lg:col-span-4">
            <aside className="sticky top-24 space-y-8">
              <div className="bg-stone-900/40 backdrop-blur-sm border border-primary/20 p-6 rounded-sm shadow-sm shadow-stone-950/50">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    info
                  </span>
                  Marginalia
                </h4>
                <div className="space-y-6">
                  {METADATA.map((item) => (
                    <div key={item.label}>
                      <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-1">
                        {item.label}
                      </label>
                      <p
                        className={`text-stone-300 ${
                          item.italic ? "italic" : "font-bold"
                        }`}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-1">
                      Preservation Level
                    </label>
                    <div className="flex gap-1 mt-2">
                      {[1, 1, 1, 0, 0].map((filled, i) => (
                        <div
                          key={i}
                          className={`h-1 w-6 ${
                            filled ? "bg-primary" : "bg-primary/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-6 border-l-2 border-primary/30 italic text-stone-400 text-sm leading-relaxed">
                <span className="not-italic font-bold text-primary text-xs block mb-2 uppercase tracking-widest">
                  Translator&apos;s Note:
                </span>
                &ldquo;The term &lsquo;Void-Speaking&rsquo; likely refers to
                the pre-phonetic meditation technique used by the Scribes of
                the Third Era. Most initiates lost their sight within a decade
                of beginning the practice.&rdquo;
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-stone-500">
                  Linked Records
                </h4>
                <ul className="space-y-3">
                  {LINKED_RECORDS.map((record) => (
                    <li
                      key={record.title}
                      className="group flex items-start gap-3 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">
                        description
                      </span>
                      <div>
                        <p className="text-sm text-stone-300 group-hover:text-primary transition-colors">
                          {record.title}
                        </p>
                        <p className="text-[10px] text-stone-600 uppercase tracking-tighter">
                          {record.kind}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Contextual FAB — edit this entry */}
      <Link
        href="/scribe"
        className="fixed bottom-8 right-8 z-50 bg-primary hover:brightness-110 text-on-primary w-14 h-14 rounded-sm flex items-center justify-center shadow-xl shadow-primary/20 transition-all active:scale-95 group"
        aria-label="Edit this entry"
      >
        <span
          className="material-symbols-outlined transition-transform group-hover:rotate-12"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          ink_pen
        </span>
      </Link>
    </AppShell>
  );
}
