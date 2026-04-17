import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScribeDesk } from "@/app/scribe/ScribeDesk";
import type { ScribeSubject } from "@/lib/vault/scribe";

const emptyWikilinks = {
  nodeSlugs: new Set<string>(),
  lexiconSlugs: new Set<string>(),
};
const emptyTooltips = { terms: [] };

const baseSubject: ScribeSubject = {
  kind: "node",
  slug: "fort-ashby",
  name: "Fort Ashby",
  bodyMd: "The garrison stands at the crossroads.",
  sections: [],
  frontmatter: {},
  origin: "vault",
  updatedAt: new Date("2026-04-01T00:00:00Z"),
};

describe("ScribeDesk", () => {
  it("renders the subject name in the desk header", () => {
    render(
      <ScribeDesk
        subject={baseSubject}
        wikilinks={emptyWikilinks}
        lexiconTooltips={emptyTooltips}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /fort ashby/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the subject body via the markdown pipeline", () => {
    render(
      <ScribeDesk
        subject={baseSubject}
        wikilinks={emptyWikilinks}
        lexiconTooltips={emptyTooltips}
      />,
    );
    expect(
      screen.getByText(/the garrison stands at the crossroads/i),
    ).toBeInTheDocument();
  });

  it("surfaces origin=vault in the metadata footer", () => {
    render(
      <ScribeDesk
        subject={baseSubject}
        wikilinks={emptyWikilinks}
        lexiconTooltips={emptyTooltips}
      />,
    );
    expect(screen.getByTestId("scribe-origin")).toHaveTextContent(/vault/i);
  });

  it("surfaces origin=app for app-authored subjects", () => {
    render(
      <ScribeDesk
        subject={{ ...baseSubject, origin: "app", kind: "page" }}
        wikilinks={emptyWikilinks}
        lexiconTooltips={emptyTooltips}
      />,
    );
    expect(screen.getByTestId("scribe-origin")).toHaveTextContent(/app/i);
  });
});
