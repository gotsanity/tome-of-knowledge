import type { RecentError } from "@/lib/feedback/payload";

const MAX_ENTRIES = 10;

let buffer: RecentError[] = [];
let installed = false;

function push(message: string, stack: string | null) {
  buffer.push({
    message,
    stack,
    at: new Date().toISOString(),
  });
  if (buffer.length > MAX_ENTRIES) {
    buffer.splice(0, buffer.length - MAX_ENTRIES);
  }
}

function handleError(event: ErrorEvent) {
  const err = event.error as Error | undefined;
  push(event.message ?? err?.message ?? "Unknown error", err?.stack ?? null);
}

function handleRejection(event: Event) {
  const reason = (event as Event & { reason?: unknown }).reason;
  if (reason instanceof Error) {
    push(reason.message, reason.stack ?? null);
  } else {
    push(String(reason ?? "Unhandled rejection"), null);
  }
}

export function installErrorBuffer(): void {
  if (installed) return;
  if (typeof window === "undefined") return;
  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleRejection);
  installed = true;
}

export function getErrorBuffer(): RecentError[] {
  return buffer.slice();
}

export function resetErrorBufferForTests(): void {
  if (typeof window !== "undefined" && installed) {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleRejection);
  }
  buffer = [];
  installed = false;
}
