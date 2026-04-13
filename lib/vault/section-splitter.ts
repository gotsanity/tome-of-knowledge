export type ParsedSection = {
  heading: string;
  order: number;
  bodyMd: string;
};

export function splitSections(body: string): ParsedSection[] {
  if (body.length === 0) return [];

  const lines = body.split(/\r?\n/);
  const sections: ParsedSection[] = [];
  let currentHeading = "";
  let currentLines: string[] = [];
  let inFence = false;

  const flush = () => {
    const text = currentLines.join("\n");
    if (currentHeading === "" && text.trim() === "") return;
    sections.push({
      heading: currentHeading,
      order: sections.length,
      bodyMd: text,
    });
  };

  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      currentLines.push(line);
      continue;
    }
    const match = !inFence && line.match(/^## (?!#)(.+?)\s*$/);
    if (match) {
      flush();
      currentHeading = match[1].trim();
      currentLines = [];
      continue;
    }
    currentLines.push(line);
  }
  flush();

  return sections;
}
