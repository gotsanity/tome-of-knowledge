import { describe, it, expect } from "vitest";
import {
  parseFeedbackPayload,
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
} from "@/lib/feedback/payload";

function validBody() {
  return {
    category: "bug" as FeedbackCategory,
    description: "Drop cap spacing looks off on Firefox",
    screenshotDataUrl:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD",
    metadata: {
      pathname: "/entry",
      search: "?id=foo",
      title: "The Grand Library",
      viewportWidth: 1440,
      viewportHeight: 900,
      devicePixelRatio: 2,
      userAgent: "Mozilla/5.0",
      timestamp: "2026-04-13T12:00:00.000Z",
      recentErrors: [
        { message: "boom", stack: "Error: boom\n at x", at: "2026-04-13T11:59:59.000Z" },
      ],
    },
  };
}

describe("parseFeedbackPayload", () => {
  it("accepts a well-formed payload", () => {
    const result = parseFeedbackPayload(validBody());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.category).toBe("bug");
      expect(result.value.description).toBe(
        "Drop cap spacing looks off on Firefox"
      );
    }
  });

  it("rejects a non-object body", () => {
    expect(parseFeedbackPayload(null).ok).toBe(false);
    expect(parseFeedbackPayload("hi").ok).toBe(false);
    expect(parseFeedbackPayload(42).ok).toBe(false);
  });

  it("rejects an unknown category", () => {
    const body = { ...validBody(), category: "rant" };
    const result = parseFeedbackPayload(body);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/category/);
    }
  });

  it("accepts every known category", () => {
    for (const c of FEEDBACK_CATEGORIES) {
      const result = parseFeedbackPayload({ ...validBody(), category: c });
      expect(result.ok).toBe(true);
    }
  });

  it("rejects empty or missing description", () => {
    expect(parseFeedbackPayload({ ...validBody(), description: "" }).ok).toBe(
      false
    );
    expect(parseFeedbackPayload({ ...validBody(), description: "   " }).ok).toBe(
      false
    );
    const { description, ...rest } = validBody();
    void description;
    expect(parseFeedbackPayload(rest).ok).toBe(false);
  });

  it("rejects a description longer than 5000 chars", () => {
    const body = { ...validBody(), description: "x".repeat(5001) };
    expect(parseFeedbackPayload(body).ok).toBe(false);
  });

  it("trims the description", () => {
    const body = { ...validBody(), description: "  hello  " };
    const result = parseFeedbackPayload(body);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.description).toBe("hello");
  });

  it("allows an absent screenshot (null)", () => {
    const body = { ...validBody(), screenshotDataUrl: null };
    const result = parseFeedbackPayload(body);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.screenshotDataUrl).toBeNull();
  });

  it("rejects a screenshot that is not a data URL", () => {
    const body = { ...validBody(), screenshotDataUrl: "https://x/y.png" };
    expect(parseFeedbackPayload(body).ok).toBe(false);
  });

  it("rejects a screenshot with a non-image mime type", () => {
    const body = {
      ...validBody(),
      screenshotDataUrl: "data:text/plain;base64,aGk=",
    };
    expect(parseFeedbackPayload(body).ok).toBe(false);
  });

  it("rejects metadata that is missing required fields", () => {
    const body = validBody();
    // @ts-expect-error deliberate
    delete body.metadata.pathname;
    expect(parseFeedbackPayload(body).ok).toBe(false);
  });

  it("coerces missing recentErrors to an empty array", () => {
    const body = validBody();
    // @ts-expect-error deliberate
    delete body.metadata.recentErrors;
    const result = parseFeedbackPayload(body);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.metadata.recentErrors).toEqual([]);
  });

  it("caps recentErrors at 20 entries", () => {
    const body = validBody();
    body.metadata.recentErrors = Array.from({ length: 50 }, (_, i) => ({
      message: `e${i}`,
      stack: null as unknown as string,
      at: "2026-04-13T11:59:59.000Z",
    }));
    const result = parseFeedbackPayload(body);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.metadata.recentErrors).toHaveLength(20);
  });
});
