import { Fragment } from "react";
import { AppShell, Button } from "../components";

const TOOLBAR_ICONS: Array<{ icon: string; active?: boolean }> = [
  { icon: "format_bold" },
  { icon: "format_italic" },
  { icon: "match_case", active: true },
  { icon: "format_quote" },
  { icon: "link" },
  { icon: "image" },
];

export default function ScribeDeskPage() {
  return (
    <AppShell active="scribe">
      <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-12">
        {/* Editor Header / Controls */}
        <header className="flex justify-between items-end mb-12 border-b border-primary/10 pb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-2 block">
              Volume IV • Section VII
            </span>
            <h1 className="text-4xl font-black text-on-surface tracking-tighter leading-none mb-2">
              The Whispering Glade
            </h1>
            <p className="text-stone-500 italic">
              Last annotated by Archivist Thorne, 3 days past
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="secondary" size="sm" icon="history">
              Drafts
            </Button>
            <Button variant="primary" size="sm" icon="workspace_premium">
              Seal &amp; Save
            </Button>
          </div>
        </header>

        {/* Parchment Editor Canvas */}
        <section className="bg-stone-900/40 border border-primary/5 p-12 lg:p-20 parchment-glow min-h-[819px] relative">
          {/* Ornamental Corner Flourish */}
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

          {/* Editor Toolbar */}
          <div className="flex justify-center mb-16">
            <div className="flex space-x-6 items-center px-6 py-2 bg-black/40 backdrop-blur-md border border-primary/20 rounded-full shadow-2xl">
              {TOOLBAR_ICONS.map(({ icon, active }, i) => (
                <Fragment key={icon}>
                  <button
                    className={
                      active
                        ? "material-symbols-outlined text-primary"
                        : "material-symbols-outlined text-stone-400 hover:text-primary transition-colors"
                    }
                    style={
                      active ? { fontVariationSettings: "'FILL' 1" } : undefined
                    }
                  >
                    {icon}
                  </button>
                  {i === 2 && <div className="w-px h-4 bg-stone-800" />}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Main Text Area */}
          <article className="prose prose-invert max-w-none">
            <div
              className="drop-cap-sm text-xl leading-relaxed text-stone-300 mb-8 outline-none focus:ring-0"
              contentEditable
              suppressContentEditableWarning
            >
              The air within the Glade carries a weight not found elsewhere in
              the Empire. It is thick with the scent of crushed pine needles
              and something older—metallic, like ancient bronze left out in
              the rain. Here, the silence is not an absence of sound, but a
              presence that watches.
            </div>
            <div
              className="text-xl leading-relaxed text-stone-300 mb-8 outline-none focus:ring-0"
              contentEditable
              suppressContentEditableWarning
            >
              Scholars from the <em>Grand University</em> have often debated
              the origin of the &ldquo;Whisper.&rdquo; Some claim it is the
              collective memory of the trees, others insist it is a lingering
              magical resonance from the Third Era. Regardless of its source,
              no man enters the Glade without a cold iron pendant at his
              throat.
            </div>

            {/* Marginalia / Callout */}
            <div className="my-12 ml-12 border-l-2 border-primary/30 pl-8 relative">
              <span className="absolute -left-3 top-0 bg-background p-1">
                <span className="material-symbols-outlined text-primary text-sm">
                  auto_stories
                </span>
              </span>
              <div className="text-sm font-bold uppercase tracking-widest text-primary/80 mb-2">
                Annotation 04-B
              </div>
              <div
                className="text-lg italic text-stone-400"
                contentEditable
                suppressContentEditableWarning
              >
                &ldquo;The iron must be pure, forged in the hearth of a silent
                smith. Anything less is merely jewelry.&rdquo;
              </div>
            </div>

            <div
              className="text-xl leading-relaxed text-stone-300 mb-8 outline-none focus:ring-0"
              contentEditable
              suppressContentEditableWarning
            >
              We discovered the first obelisk near the western edge. It was
              half-submerged in the peat, its surface etched with runes that
              seemed to shift when viewed through the corner of one&apos;s
              eye. Thorne insisted we set up camp there, despite the growing
              unease among the porters. That night, the fire burned blue, and
              the shadows refused to stay attached to their masters.
            </div>

            {/* Tipped-in Plate */}
            <figure className="my-12 flex flex-col items-center">
              <div className="p-2 bg-stone-800/40 border border-primary/20 shadow-xl">
                <div className="w-full h-96 bg-gradient-to-br from-stone-800 via-stone-900 to-black grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary/30 text-[120px]">
                    forest
                  </span>
                </div>
              </div>
              <figcaption className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
                Fig 1.2: The Obelisk at Western Edge (Lithograph)
              </figcaption>
            </figure>

            {/* Page Break Ornament */}
            <div className="flex justify-center my-16 opacity-30">
              <svg
                width="200"
                height="20"
                viewBox="0 0 200 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 10H85M115 10H200"
                  stroke="#d4af37"
                  strokeWidth="1"
                />
                <rect
                  x="93"
                  y="3"
                  width="14"
                  height="14"
                  transform="rotate(45 93 3)"
                  stroke="#d4af37"
                  strokeWidth="1"
                />
              </svg>
            </div>

            <div
              className="text-xl leading-relaxed text-stone-300 mb-8 outline-none focus:ring-0 italic"
              contentEditable
              suppressContentEditableWarning
            >
              The transcription continues on the reverse...
            </div>
          </article>
        </section>

        {/* Metadata Footer */}
        <footer className="mt-12 flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.2em] text-stone-600">
          <div className="flex space-x-6">
            <span>Characters: 1,402</span>
            <span>Words: 214</span>
            <span>Ink Level: 84%</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Synchronizing with Archive...</span>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}
