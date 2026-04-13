import type { ReactNode } from "react";

type SectionHeadingProps = {
  title: string;
  actions?: ReactNode;
};

export function SectionHeading({ title, actions }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-8 mb-16">
      <h2 className="text-4xl font-black tracking-tight text-on-surface">
        {title}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
