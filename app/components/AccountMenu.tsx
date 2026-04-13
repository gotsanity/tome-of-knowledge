"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginModal } from "./LoginModal";

export function AccountMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const user = session?.user;
  const isGm = user?.role === "gm";

  async function handleCreateInvite() {
    setOpen(false);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user" }),
    });
    if (res.ok) {
      const data = (await res.json()) as { url: string };
      const full = `${window.location.origin}${data.url}`;
      await navigator.clipboard.writeText(full).catch(() => {});
      window.alert(`Invite URL copied to clipboard:\n\n${full}`);
    } else {
      window.alert("Failed to create invite");
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center text-2xl hover:text-primary transition-colors"
        aria-label="Account menu"
      >
        <span className="material-symbols-outlined">account_circle</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-stone-900 border border-stone-800 rounded-sm shadow-xl shadow-stone-950/50 z-50 overflow-hidden">
          {status === "loading" && (
            <div className="px-5 py-4 text-xs uppercase tracking-widest text-stone-500">
              Loading…
            </div>
          )}
          {status !== "loading" && !user && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setLoginOpen(true);
              }}
              className="w-full text-left px-5 py-4 text-sm text-stone-300 hover:bg-stone-800 hover:text-primary transition-colors flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-base">
                login
              </span>
              Sign in
            </button>
          )}
          {user && (
            <>
              <div className="px-5 py-4 border-b border-stone-800/70">
                <p className="text-sm font-bold text-stone-200">
                  {user.displayName ?? user.username}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-0.5">
                  {isGm ? "Game Master" : "Scholar"}
                </p>
              </div>
              {isGm && (
                <button
                  type="button"
                  onClick={handleCreateInvite}
                  className="w-full text-left px-5 py-3 text-sm text-stone-300 hover:bg-stone-800 hover:text-primary transition-colors flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-base">
                    mail
                  </span>
                  Create invite
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  setOpen(false);
                  await signOut({ redirect: false });
                  router.refresh();
                }}
                className="w-full text-left px-5 py-3 text-sm text-stone-300 hover:bg-stone-800 hover:text-primary transition-colors flex items-center gap-3 border-t border-stone-800/70"
              >
                <span className="material-symbols-outlined text-base">
                  logout
                </span>
                Sign out
              </button>
            </>
          )}
        </div>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
