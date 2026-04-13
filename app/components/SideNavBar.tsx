import Link from "next/link";

export type NavKey = "library" | "contents" | "scribe" | "archived";

type NavItem = {
  key: NavKey;
  href: string;
  icon: string;
  label: string;
};

const ITEMS: NavItem[] = [
  { key: "library", href: "/", icon: "auto_stories", label: "Library" },
  {
    key: "contents",
    href: "/contents",
    icon: "format_list_bulleted",
    label: "Table of Contents",
  },
  { key: "scribe", href: "/scribe", icon: "edit_note", label: "Scribe Desk" },
  { key: "archived", href: "#", icon: "inventory_2", label: "Archived" },
];

export function SideNavBar({ active }: { active: NavKey }) {
  return (
    <aside className="w-72 flex flex-col border-r border-stone-800 sticky left-0 top-0 bg-stone-900 z-50 h-screen overflow-hidden">
      <div className="p-8 border-b border-stone-800/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="material-symbols-outlined text-primary">
              menu_book
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary leading-none">
              The Archivist
            </h2>
            <p className="text-xs uppercase tracking-widest text-stone-500 mt-1">
              Great Library of Oakhaven
            </p>
          </div>
        </div>
        <button className="w-full py-3 bg-primary/10 border border-primary/20 text-primary uppercase tracking-widest text-sm font-bold hover:bg-primary/20 transition-all active:scale-[0.98]">
          New Entry
        </button>
      </div>
      <nav className="flex flex-col h-full py-8 space-y-2 overflow-y-auto no-scrollbar">
        {ITEMS.map((item) => {
          const isActive = item.key === active;
          const classes = isActive
            ? "flex items-center gap-4 text-primary font-bold border-r-2 border-primary bg-stone-800/50 py-3 px-6 transition-colors translate-x-1"
            : "flex items-center gap-4 text-stone-400 py-3 px-6 hover:bg-stone-800 hover:text-primary transition-colors";
          return (
            <Link key={item.key} href={item.href} className={classes}>
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-lg">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-6 mt-auto border-t border-stone-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm border border-primary/30 bg-gradient-to-br from-amber-900/40 to-stone-900 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">
              account_circle
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-stone-300">Elder Thorne</p>
            <p className="text-[10px] uppercase tracking-tighter text-stone-500">
              Master of Records
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
