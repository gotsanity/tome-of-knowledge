import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/components/AccountMenu", () => ({
  AccountMenu: () => <div data-testid="account-menu" />,
}));

import { TopAppBar } from "@/app/components/TopAppBar";

describe("TopAppBar", () => {
  it("links the Characters nav item to the player characters ToC section", () => {
    render(<TopAppBar />);
    const link = screen.getByRole("link", { name: /^characters$/i });
    expect(link).toHaveAttribute("href", "/contents#pc");
  });
});
