"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import {
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
  type FeedbackMetadata,
} from "@/lib/feedback/payload";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;
function useIsMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

type Props = {
  onClose: () => void;
  screenshotDataUrl: string | null;
  metadata: FeedbackMetadata;
};

type SubmissionState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; issueUrl: string }
  | { kind: "error"; message: string };

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: "Bug",
  idea: "Idea",
  question: "Question",
  other: "Other",
};

export function FeedbackModal({
  onClose,
  screenshotDataUrl,
  metadata,
}: Props) {
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<SubmissionState>({ kind: "idle" });
  const mounted = useIsMounted();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length === 0) return;
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category,
          description,
          screenshotDataUrl,
          metadata,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setState({
          kind: "error",
          message: body.error ?? `Submission failed (${res.status})`,
        });
        return;
      }
      const body = (await res.json()) as { issueUrl: string };
      setState({ kind: "success", issueUrl: body.issueUrl });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container border border-outline-variant shadow-2xl shadow-primary/5 p-10 rounded-sm relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          aria-label="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="mb-6">
          <h2
            id="feedback-modal-title"
            className="text-2xl font-black tracking-tight text-on-surface mb-2"
          >
            Report an Issue
          </h2>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant">
            Send feedback to the scribes
          </p>
        </div>

        {state.kind === "success" ? (
          <div className="space-y-4">
            <p className="text-on-surface">
              Thank you — your feedback has been filed.
            </p>
            <a
              href={state.issueUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-primary underline"
            >
              View issue →
            </a>
            <div>
              <Button type="button" variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {screenshotDataUrl && (
              <div>
                <span className="text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
                  Screenshot preview
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotDataUrl}
                  alt="Captured screenshot"
                  className="w-full max-h-40 object-contain border border-outline-variant rounded-sm bg-background"
                />
              </div>
            )}

            <label className="block">
              <span className="text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
                Category
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                className="w-full bg-background border border-outline-variant text-on-surface px-4 py-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:border-primary/70"
              >
                {FEEDBACK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
                What happened?
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                required
                autoFocus
                maxLength={5000}
                placeholder="Describe what you were doing and what went wrong…"
                className="w-full bg-background border border-outline-variant text-on-surface px-4 py-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:border-primary/70 resize-y"
              />
            </label>

            {state.kind === "error" && (
              <p
                role="alert"
                className="text-error text-xs uppercase tracking-widest"
              >
                {state.message}
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  state.kind === "submitting" ||
                  description.trim().length === 0
                }
              >
                {state.kind === "submitting" ? "Sending…" : "Send feedback"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
