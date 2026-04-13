import { normalizeSlug } from "./slug";
import type { LexiconDomain } from "@/lib/db/schema";

export type ParsedLexiconTerm = {
  slug: string;
  term: string;
  domain: LexiconDomain;
  definition: string;
  aliases: string[];
  usage: string | null;
  notes: string | null;
  relatedTerms: string[];
  tooltipEnabled: boolean;
};

const FIELD_RE = /^\*\*([A-Za-z ]+):\*\*\s*(.*)$/;

function stripFrontmatter(input: string): string {
  if (!input.startsWith("---")) return input;
  const end = input.indexOf("\n---", 3);
  if (end === -1) return input;
  return input.slice(end + 4);
}

function parseList(raw: string): string[] {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "—" || trimmed === "-") return [];
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function coerceDomain(raw: string): LexiconDomain {
  const v = raw.trim();
  if (v === "CWS" || v === "World" || v === "RPG") return v;
  return "World";
}

export function parseLexicon(source: string): ParsedLexiconTerm[] {
  const body = stripFrontmatter(source);
  const lines = body.split(/\r?\n/);
  const terms: ParsedLexiconTerm[] = [];

  let current: {
    term: string;
    fields: Map<string, string>;
  } | null = null;

  const flush = () => {
    if (!current) return;
    const f = current.fields;
    const definition = f.get("Definition") ?? "";
    if (definition === "") {
      current = null;
      return;
    }
    terms.push({
      slug: normalizeSlug(current.term),
      term: current.term,
      domain: coerceDomain(f.get("Domain") ?? "World"),
      definition,
      aliases: parseList(f.get("Aliases") ?? ""),
      usage: (f.get("Usage") ?? "").trim() === "" ? null : f.get("Usage")!.trim(),
      notes: (f.get("Notes") ?? "").trim() === "" ? null : f.get("Notes")!.trim(),
      relatedTerms: parseList(f.get("Related") ?? ""),
      tooltipEnabled: true,
    });
    current = null;
  };

  for (const line of lines) {
    const headingMatch = line.match(/^## (.+?)\s*$/);
    if (headingMatch) {
      flush();
      current = { term: headingMatch[1].trim(), fields: new Map() };
      continue;
    }
    if (!current) continue;
    const fieldMatch = line.match(FIELD_RE);
    if (fieldMatch) {
      current.fields.set(fieldMatch[1].trim(), fieldMatch[2].trim());
    }
  }
  flush();

  return terms;
}
