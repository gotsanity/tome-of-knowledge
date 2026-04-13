import type { ReactNode } from "react";
import { SideNavBar, type NavKey } from "./SideNavBar";
import { TopAppBar } from "./TopAppBar";

type AppShellProps = {
  active: NavKey;
  children: ReactNode;
};

export function AppShell({ active, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen no-scrollbar">
      <SideNavBar active={active} />
      <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
        <TopAppBar />
        <main className="flex-1">{children}</main>
      </div>
      {/* Decorative Corner Element */}
      <div className="fixed bottom-0 right-0 w-32 h-32 pointer-events-none z-[60] opacity-20 overflow-hidden">
        <svg
          className="w-full h-full text-primary fill-current translate-x-12 translate-y-12"
          viewBox="0 0 100 100"
        >
          <path d="M0,100 C0,44.77 44.77,0 100,0 L100,100 Z" />
        </svg>
      </div>
    </div>
  );
}
