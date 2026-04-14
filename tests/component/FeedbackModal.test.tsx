import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedbackModal } from "@/app/components/FeedbackModal";
import type { FeedbackMetadata } from "@/lib/feedback/payload";

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  (globalThis as unknown as { fetch: typeof fetch }).fetch =
    mockFetch as unknown as typeof fetch;
});

function metadata(): FeedbackMetadata {
  return {
    pathname: "/entry",
    search: "",
    title: "Entry",
    viewportWidth: 1280,
    viewportHeight: 720,
    devicePixelRatio: 1,
    userAgent: "ua",
    timestamp: "2026-04-13T12:00:00.000Z",
    recentErrors: [],
  };
}

describe("FeedbackModal", () => {
  it("renders category select and description textarea", () => {
    render(
      <FeedbackModal
        onClose={() => {}}
        screenshotDataUrl={null}
        metadata={metadata()}
      />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders screenshot preview when provided", () => {
    render(
      <FeedbackModal
        onClose={() => {}}
        screenshotDataUrl="data:image/jpeg;base64,xyz"
        metadata={metadata()}
      />
    );
    expect(
      screen.getByRole("img", { name: /captured screenshot/i })
    ).toBeInTheDocument();
  });

  it("submit button is disabled until description has content", async () => {
    const user = userEvent.setup();
    render(
      <FeedbackModal
        onClose={() => {}}
        screenshotDataUrl={null}
        metadata={metadata()}
      />
    );
    const submit = screen.getByRole("button", { name: /send feedback/i });
    expect(submit).toBeDisabled();
    await user.type(screen.getByRole("textbox"), "something broken");
    expect(submit).toBeEnabled();
  });

  it("posts to /api/feedback and shows success on 200", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ issueUrl: "https://github.com/x/y/issues/1" }),
    });
    const user = userEvent.setup();
    render(
      <FeedbackModal
        onClose={() => {}}
        screenshotDataUrl={null}
        metadata={metadata()}
      />
    );
    await user.type(screen.getByRole("textbox"), "drop cap is off");
    await user.click(screen.getByRole("button", { name: /send feedback/i }));

    await waitFor(() => {
      expect(screen.getByText(/thank you/i)).toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/feedback");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.category).toBe("bug");
    expect(body.description).toBe("drop cap is off");
    expect(body.metadata.pathname).toBe("/entry");
    expect(screen.getByRole("link", { name: /view issue/i })).toHaveAttribute(
      "href",
      "https://github.com/x/y/issues/1"
    );
  });

  it("shows error message on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "description is required" }),
    });
    const user = userEvent.setup();
    render(
      <FeedbackModal
        onClose={() => {}}
        screenshotDataUrl={null}
        metadata={metadata()}
      />
    );
    await user.type(screen.getByRole("textbox"), "boom");
    await user.click(screen.getByRole("button", { name: /send feedback/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /description is required/i
      );
    });
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <FeedbackModal
        onClose={onClose}
        screenshotDataUrl={null}
        metadata={metadata()}
      />
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});
