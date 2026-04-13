"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;
function useIsMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "./Button";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function LoginModal({ open, onClose }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const mounted = useIsMounted();

  if (!open || !mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (res?.error) {
      setError("Invalid credentials");
      return;
    }

    setUsername("");
    setPassword("");
    onClose();
    router.refresh();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-stone-900 border border-stone-800 shadow-2xl shadow-primary/5 p-10 rounded-sm relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-500 hover:text-primary transition-colors"
          aria-label="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tight text-on-surface mb-2">
            Enter the Archive
          </h2>
          <p className="text-xs uppercase tracking-widest text-stone-500">
            Present your credentials to the archivist
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-stone-500 block mb-2">
              Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              autoFocus
              className="w-full bg-stone-950/50 border border-stone-800 text-stone-200 px-4 py-3 rounded-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-stone-500 block mb-2">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full bg-stone-950/50 border border-stone-800 text-stone-200 px-4 py-3 rounded-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none"
            />
          </label>
          {error && (
            <p className="text-red-400 text-xs uppercase tracking-widest">
              {error}
            </p>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Entering..." : "Enter"}
          </Button>
        </form>
      </div>
    </div>,
    document.body
  );
}
