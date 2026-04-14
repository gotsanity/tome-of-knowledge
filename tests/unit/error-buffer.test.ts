import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  installErrorBuffer,
  getErrorBuffer,
  resetErrorBufferForTests,
} from "@/lib/client/error-buffer";

describe("error-buffer", () => {
  beforeEach(() => {
    resetErrorBufferForTests();
  });

  it("starts empty before install", () => {
    expect(getErrorBuffer()).toEqual([]);
  });

  it("captures window error events after install", () => {
    installErrorBuffer();
    const event = new ErrorEvent("error", {
      message: "oh no",
      error: new Error("oh no"),
    });
    window.dispatchEvent(event);

    const buf = getErrorBuffer();
    expect(buf).toHaveLength(1);
    expect(buf[0].message).toBe("oh no");
    expect(buf[0].stack).toContain("Error: oh no");
    expect(buf[0].at).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it("captures unhandled promise rejections", () => {
    installErrorBuffer();
    const reason = new Error("async boom");
    const event = new Event("unhandledrejection") as Event & {
      reason: unknown;
      promise: Promise<unknown>;
    };
    Object.assign(event, { reason, promise: Promise.reject(reason).catch(() => {}) });
    window.dispatchEvent(event);

    const buf = getErrorBuffer();
    expect(buf).toHaveLength(1);
    expect(buf[0].message).toBe("async boom");
  });

  it("caps the buffer at 10 entries (FIFO)", () => {
    installErrorBuffer();
    for (let i = 0; i < 15; i++) {
      window.dispatchEvent(
        new ErrorEvent("error", { message: `e${i}`, error: new Error(`e${i}`) })
      );
    }
    const buf = getErrorBuffer();
    expect(buf).toHaveLength(10);
    expect(buf[0].message).toBe("e5");
    expect(buf[9].message).toBe("e14");
  });

  it("install is idempotent — listeners are registered once", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    installErrorBuffer();
    installErrorBuffer();
    installErrorBuffer();
    const errorCalls = addSpy.mock.calls.filter(([name]) => name === "error");
    const rejCalls = addSpy.mock.calls.filter(
      ([name]) => name === "unhandledrejection"
    );
    expect(errorCalls).toHaveLength(1);
    expect(rejCalls).toHaveLength(1);
    addSpy.mockRestore();
  });

  it("getErrorBuffer returns a copy, not the internal array", () => {
    installErrorBuffer();
    window.dispatchEvent(
      new ErrorEvent("error", { message: "a", error: new Error("a") })
    );
    const buf1 = getErrorBuffer();
    buf1.push({ message: "mutated", stack: null, at: "x" });
    const buf2 = getErrorBuffer();
    expect(buf2).toHaveLength(1);
  });
});
