import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { LandingFooterActions } from "@/app/components/LandingFooterActions";

describe("LandingFooterActions", () => {
  beforeEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("http://localhost:3000/"),
    });
  });

  it("renders a share button, a mailto link, and a GitHub link", () => {
    render(<LandingFooterActions />);

    expect(
      screen.getByRole("button", { name: /copy page url/i }),
    ).toBeInTheDocument();

    const mail = screen.getByRole("link", { name: /email the archivist/i });
    expect(mail).toHaveAttribute("href", "mailto:gotsanity@gmail.com");

    const gh = screen.getByRole("link", { name: /view source on github/i });
    expect(gh).toHaveAttribute(
      "href",
      "https://github.com/gotsanity/tome-of-knowledge",
    );
    expect(gh).toHaveAttribute("target", "_blank");
    expect(gh).toHaveAttribute("rel", expect.stringMatching(/noopener/));
  });

  it("copies the current page URL to the clipboard when the share button is clicked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<LandingFooterActions />);

    fireEvent.click(screen.getByRole("button", { name: /copy page url/i }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("http://localhost:3000/"),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /url copied to clipboard/i }),
      ).toBeInTheDocument(),
    );
  });
});
