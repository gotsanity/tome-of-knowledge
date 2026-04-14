/**
 * A Translator's-Note-style quote block. Renders a labeled, italic body
 * with an optional GM chip. Pure presentation primitive — callers decide
 * when and where to show it, and visibility gating happens upstream.
 *
 * Not currently wired into /node/[slug] because CWS v3.0 moved all
 * frontmatter that used to drive blocks into body sections. Kept for
 * future designs that want a labeled quote treatment for prose content.
 */
export function NodeBlock({
  label,
  value,
  gmOnly,
}: {
  label: string;
  value: string | readonly string[];
  gmOnly?: boolean;
}) {
  const items = Array.isArray(value) ? value : [value];
  return (
    <div className="bg-primary/5 p-6 border-l-2 border-primary/30 italic text-on-surface-variant text-sm leading-relaxed">
      <div className="flex items-center gap-2 not-italic mb-2">
        <span className="font-bold text-primary text-xs uppercase tracking-widest">
          {label}
        </span>
        {gmOnly && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-[9px] uppercase tracking-widest text-primary font-bold"
            title="GM only"
          >
            GM<span className="sr-only"> only</span>
          </span>
        )}
      </div>
      {items.length === 1 ? (
        <p>{items[0]}</p>
      ) : (
        <ul className="list-disc pl-5 space-y-1 not-italic">
          {items.map((item, i) => (
            <li key={i} className="italic">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
