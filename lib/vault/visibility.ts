import type { NodeVisibility } from "@/lib/db/schema";

export const FORBIDDEN_PUBLISHED_HEADINGS: readonly string[] = [
  "## Secrets",
  "## Notes",
  "## Hooks",
  "## True Account",
  "## Private Goal",
  "## Weak Point",
];

export type VisibilityValidationResult = {
  ok: boolean;
  errors: string[];
};

export function validateNodeVisibility(input: {
  visibility: NodeVisibility;
  bodyMd: string;
  sourcePath: string;
}): VisibilityValidationResult {
  if (input.visibility !== "published") {
    return { ok: true, errors: [] };
  }

  const errors: string[] = [];
  const lines = input.bodyMd.split(/\r?\n/);
  const forbiddenLower = FORBIDDEN_PUBLISHED_HEADINGS.map((h) => h.toLowerCase());

  for (const line of lines) {
    const match = line.match(/^## (?!#)(.+?)\s*$/);
    if (!match) continue;
    const canonical = `## ${match[1].trim()}`.toLowerCase();
    const idx = forbiddenLower.indexOf(canonical);
    if (idx !== -1) {
      errors.push(
        `${input.sourcePath}: published node contains forbidden heading "${FORBIDDEN_PUBLISHED_HEADINGS[idx]}"`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}
