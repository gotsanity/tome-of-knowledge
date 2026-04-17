import Link from "next/link";
import type { ScribeSubjectKind } from "@/lib/vault/scribe";

/**
 * Icon-link that takes the reader from a subject view (node or page) to the
 * Scribe desk for that subject. The desk URL is derived from kind + slug so
 * callers don't have to know the route shape.
 */
export function ScribeButton({
  kind,
  slug,
  label = "Edit this entry",
}: {
  kind: ScribeSubjectKind;
  slug: string;
  label?: string;
}) {
  const href = `/scribe/${kind}/${slug}`;
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
