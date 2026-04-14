"use client";

import { useState, useCallback, useRef } from "react";
import { FeedbackModal } from "./FeedbackModal";
import { getErrorBuffer } from "@/lib/client/error-buffer";
import type { FeedbackMetadata } from "@/lib/feedback/payload";

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.85;

function collectMetadata(): FeedbackMetadata {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    title: document.title,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    recentErrors: getErrorBuffer(),
  };
}

async function captureScreenshot(): Promise<string | null> {
  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(document.body, {
      useCORS: true,
      logging: false,
      backgroundColor: null,
    });
    const scale = Math.min(1, MAX_WIDTH / canvas.width);
    if (scale >= 1) {
      return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    }
    const scaled = document.createElement("canvas");
    scaled.width = Math.round(canvas.width * scale);
    scaled.height = Math.round(canvas.height * scale);
    const ctx = scaled.getContext("2d");
    if (!ctx) return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
    return scaled.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch (err) {
    console.warn("[feedback] screenshot capture failed", err);
    return null;
  }
}

export function FeedbackTrigger() {
  const [open, setOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<FeedbackMetadata | null>(null);
  const [capturing, setCapturing] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);
    const meta = collectMetadata();
    const shot = await captureScreenshot();
    setMetadata(meta);
    setScreenshot(shot);
    setCapturing(false);
    setOpen(true);
  }, [capturing]);

  return (
    <>
      <div className="fixed bottom-0 right-0 w-32 h-32 z-[60] overflow-hidden group">
        <svg
          className="absolute inset-0 w-full h-full text-primary fill-current translate-x-12 translate-y-12 opacity-20 group-hover:opacity-50 transition-opacity pointer-events-none"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <path d="M0,100 C0,44.77 44.77,0 100,0 L100,100 Z" />
        </svg>
        <button
          ref={triggerRef}
          type="button"
          onClick={handleClick}
          disabled={capturing}
          aria-label="Report an issue"
          title="Report an issue"
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant text-primary flex items-center justify-center shadow-lg shadow-background/60 hover:bg-surface-container-highest hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:opacity-50 disabled:cursor-wait"
        >
          <span className="material-symbols-outlined text-base leading-none">
            {capturing ? "hourglass_empty" : "bug_report"}
          </span>
        </button>
      </div>

      {open && metadata && (
        <FeedbackModal
          onClose={() => setOpen(false)}
          screenshotDataUrl={screenshot}
          metadata={metadata}
        />
      )}
    </>
  );
}
