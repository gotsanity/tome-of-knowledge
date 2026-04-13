import { normalizeSlug } from "./slug";

export type ParsedWikilink = {
  slug: string;
  display: string;
  start: number;
  end: number;
};

/**
 * Walks a markdown body once, skipping fenced code blocks and inline code,
 * and extracts every `[[...]]` wikilink with its span offsets so a remark
 * plugin can rewrite the ranges.
 */
export function extractWikilinks(body: string): ParsedWikilink[] {
  const results: ParsedWikilink[] = [];
  const len = body.length;
  let i = 0;
  let inFence = false;

  while (i < len) {
    // Fenced code block detection (``` at start of line)
    if (
      (i === 0 || body[i - 1] === "\n") &&
      body[i] === "`" &&
      body[i + 1] === "`" &&
      body[i + 2] === "`"
    ) {
      inFence = !inFence;
      i += 3;
      const nl = body.indexOf("\n", i);
      i = nl === -1 ? len : nl + 1;
      continue;
    }

    if (inFence) {
      i += 1;
      continue;
    }

    // Inline code span — skip until matching backtick
    if (body[i] === "`") {
      const close = body.indexOf("`", i + 1);
      if (close === -1) {
        i += 1;
      } else {
        i = close + 1;
      }
      continue;
    }

    // Wikilink
    if (body[i] === "[" && body[i + 1] === "[") {
      const close = body.indexOf("]]", i + 2);
      if (close === -1) {
        i += 2;
        continue;
      }
      const inner = body.slice(i + 2, close);
      if (!inner.includes("\n")) {
        const [slugPart, displayPart] = inner.includes("|")
          ? (inner.split("|", 2) as [string, string])
          : [inner, inner];
        const slug = normalizeSlug(slugPart);
        if (slug !== "") {
          results.push({
            slug,
            display: displayPart,
            start: i,
            end: close + 2,
          });
        }
      }
      i = close + 2;
      continue;
    }

    i += 1;
  }

  return results;
}
