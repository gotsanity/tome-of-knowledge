import Link from "next/link";

export function TopAppBar() {
  return (
    <header className="bg-stone-950/80 backdrop-blur-md text-primary tracking-tight leading-relaxed top-0 sticky z-40 shadow-sm shadow-stone-900/5 border-b border-stone-800/20">
      <div className="flex justify-between items-center w-full px-12 py-6 max-w-[1920px] mx-auto">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-2xl font-black text-primary tracking-tighter uppercase hover:brightness-110 transition-all"
          >
            Tome of Knowledge
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            <a
              href="#"
              className="text-stone-400 font-medium hover:text-primary transition-all"
            >
              Characters
            </a>
            <a
              href="#"
              className="text-stone-400 font-medium hover:text-primary transition-all"
            >
              Homebrew
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search the archives..."
              className="bg-stone-900/50 border-stone-800 text-stone-300 text-sm py-1.5 pl-4 pr-10 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 rounded-sm w-64"
            />
            <span className="material-symbols-outlined absolute right-3 text-stone-500 text-lg">
              search
            </span>
          </div>
          <span className="material-symbols-outlined text-2xl cursor-pointer hover:text-primary transition-colors">
            account_circle
          </span>
        </div>
      </div>
    </header>
  );
}
