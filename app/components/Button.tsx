import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: string;
  children: ReactNode;
};

const BASE =
  "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-ring";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:brightness-110 shadow-lg shadow-primary/10 rounded-sm",
  secondary:
    "border border-outline-variant text-on-surface hover:bg-surface-container-high rounded-sm",
  ghost: "text-on-surface-variant hover:text-primary",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-8 py-3 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [BASE, VARIANTS[variant], SIZES[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...rest}>
      {icon && (
        <span className="material-symbols-outlined text-sm">{icon}</span>
      )}
      {children}
    </button>
  );
}
