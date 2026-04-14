import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedbackTrigger } from "@/app/components/FeedbackTrigger";

describe("FeedbackTrigger", () => {
  it("does not intercept clicks on elements underneath the wrapper hit area", async () => {
    const onUnderlyingClick = vi.fn();
    render(
      <>
        <button
          type="button"
          onClick={onUnderlyingClick}
          style={{
            position: "fixed",
            bottom: 16,
            right: 64,
            width: 40,
            height: 40,
          }}
        >
          underlying
        </button>
        <FeedbackTrigger />
      </>,
    );

    // The wrapper that hosts the bug-report button is 128x128 anchored to the
    // bottom-right corner. Regression for #12: it must let pointer events
    // through everywhere except the actual button.
    const trigger = screen.getByRole("button", { name: /report an issue/i });
    const wrapper = trigger.parentElement as HTMLElement;
    expect(wrapper.className).toContain("pointer-events-none");
    expect(trigger.className).toContain("pointer-events-auto");

    await userEvent.click(screen.getByRole("button", { name: "underlying" }));
    expect(onUnderlyingClick).toHaveBeenCalledTimes(1);
  });
});
