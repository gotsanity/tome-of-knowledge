import Link from "next/link";

export type CategoryIndexItem = {
  href: string;
  letter: string;
  label: string;
  blurb: string;
};

type Props = {
  items: readonly CategoryIndexItem[];
  ariaLabel?: string;
  className?: string;
};

export function CategoryIndex({
  items,
  ariaLabel = "Category index",
  className,
}: Props) {
  return (
    <nav
      aria-label={ariaLabel}
      className={
        className ??
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8"
      }
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-label={`Browse ${item.label}`}
          className="p-6 bg-surface-container-low hover:bg-surface-container-high focus-visible:bg-surface-container-high focus-ring transition-colors group rounded-sm"
        >
          <span
            aria-hidden="true"
            className="text-primary text-3xl font-bold mb-2 block group-hover:scale-110 transition-transform origin-left"
          >
            {item.letter}
          </span>
          <h5 className="text-sm font-bold uppercase tracking-widest text-on-surface">
            {item.label}
          </h5>
          <p className="text-xs text-on-surface-variant mt-2">{item.blurb}</p>
        </Link>
      ))}
    </nav>
  );
}
