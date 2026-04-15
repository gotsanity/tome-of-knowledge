import Link from "next/link";

/**
 * Small icon-link that takes the reader from a node view to the Scribe
 * desk. Designed to nest inside a card header row alongside a heading;
 * negative margins keep it flush with the card's padding.
 */
export function ScribeButton({
  href,
  label = "Edit this entry",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="group -my-1 -mr-1 w-8 h-8 rounded-sm border border-primary/30 bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 hover:border-primary/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <span
        className="material-symbols-outlined text-base transition-transform group-hover:rotate-12"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        ink_pen
      </span>
    </Link>
  );
}
