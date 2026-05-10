/**
 * Splits a large text into overlapping chunks for better RAG retrieval.
 */
export function chunkText(
  text: string,
  chunkSize = 500,
  chunkOverlap = 80,
): string[] {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Fix hyphenated line breaks
    .replace(/(\w)-\n(\w)/g, "$1$2")
    // Collapse 3+ blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Step 1: Split into sections by detecting numbered headings like "1.", "1.1", "1.1.1"
  const sectionRegex = /(?=\n(?:\d+\.)+\s+[A-Z])/g;
  const rawSections = normalized
    .split(sectionRegex)
    .filter((s) => s.trim().length > 0);

  const chunks: string[] = [];

  for (const section of rawSections) {
    // Try to detect a heading on the first line of this section
    const lines = section.trim().split("\n");
    const headingLine = lines[0].trim();
    const isHeading = /^(\d+\.)+/.test(headingLine);
    const sectionPrefix = isHeading ? `[Section: ${headingLine}]\n` : "";

    // If section is short enough, keep as one chunk
    if (section.length <= chunkSize) {
      const chunk = (sectionPrefix + section.trim()).trim();
      if (chunk.length > 30) chunks.push(chunk);
      continue;
    }

    // Otherwise split the section into smaller pieces by sentence
    const sentences = section
      .trim()
      .split(/(?<=[.!?;])\s+/)
      .filter((s) => s.trim().length > 0);

    let current = sectionPrefix;

    for (const sentence of sentences) {
      const candidate = current ? current + " " + sentence : sentence;

      if (candidate.length > chunkSize && current.length > 0) {
        if (current.trim().length > 30) {
          chunks.push(current.trim());
        }
        const overlap = getOverlapText(current, chunkOverlap);
        current = [sectionPrefix.trim(), overlap, sentence]
          .filter(Boolean)
          .join(" ");
      } else {
        current = candidate;
      }
    }

    if (current.trim().length > 30) {
      chunks.push(current.trim());
    }
  }

  // Step 2: Post-process — remove duplicate whitespace inside chunks
  return chunks
    .map((c) => c.replace(/ {2,}/g, " ").trim())
    .filter((c) => c.length > 30);
}

function getOverlapText(text: string, maxLength: number): string {
  if (maxLength <= 0) return "";

  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;

  return normalized.slice(-maxLength).replace(/^\S+\s*/, "");
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // pdf-parse's package entry loads test files during bundling; use its parser subpath.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const data = await pdfParse(buffer);
    if (data?.text && data.text.trim().length > 50) {
      return cleanExtractedText(data.text);
    }
  } catch (e) {
    console.error("pdf-parse failed:", e);
  }
  return extractTextManual(buffer);
}

function cleanExtractedText(text: string): string {
  return reconstructTables(
    text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Remove lone page numbers
      .replace(/^\d+\s*$/gm, "")
      // Fix hyphenated line breaks
      .replace(/(\w)-\n(\w)/g, "$1$2")
      // Merge short continuation lines (line ending without punctuation followed by lowercase)
      .replace(/([^.!?:])\n([a-z])/g, "$1 $2")
      // Collapse 3+ blank lines
      .replace(/\n{3,}/g, "\n\n"),
  ).trim();
}

function extractTextManual(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const lines: string[] = [];
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let btMatch: RegExpExecArray | null;

  while ((btMatch = btEtRegex.exec(raw)) !== null) {
    const block = btMatch[1];
    const tjLocal = /\(((?:[^()\\]|\\[\s\S])*)\)\s*T[jJ]/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjLocal.exec(block)) !== null) {
      const decoded = tjMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\")
        .replace(/[^\x20-\x7E\n]/g, " ")
        .trim();
      if (decoded.length > 1) lines.push(decoded);
    }
  }

  if (lines.length > 0) return lines.join(" ");

  const asciiRuns = raw.match(/[ -~]{6,}/g) ?? [];
  return asciiRuns
    .filter((s) => s.trim().length > 5 && /[a-zA-Z]{3,}/.test(s))
    .join(" ");
}

// For tables that got split into hard-to-read chunks, try to reconstruct them into a more readable format
function reconstructTables(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Detect table-like lines: short tokens separated by spaces that look like columns
    // e.g. "1.0 99-100 Excellent" or "VPs 18" or "Instructor I 12 65-below"
    const isTableRow = (l: string) => {
      const tokens = l.trim().split(/\s{2,}|\t/);
      return (
        tokens.length >= 2 &&
        tokens.every((t) => t.trim().length > 0) &&
        l.length < 120
      );
    };

    // Detect if this line and next few lines form a table block
    if (
      isTableRow(line) &&
      i + 1 < lines.length &&
      isTableRow(lines[i + 1]?.trim())
    ) {
      // Collect all consecutive table rows
      const tableRows: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim() === "" || isTableRow(lines[i].trim()))
      ) {
        if (lines[i].trim()) tableRows.push(lines[i].trim());
        i++;
      }

      // Convert to readable key-value prose
      // First row is likely the header
      const [header, ...rows] = tableRows;
      const headers = header
        .split(/\s{2,}|\t/)
        .map((h) => h.trim())
        .filter(Boolean);

      if (headers.length >= 2 && rows.length > 0) {
        result.push(`[TABLE START]`);
        result.push(`Columns: ${headers.join(" | ")}`);
        for (const row of rows) {
          const cells = row
            .split(/\s{2,}|\t/)
            .map((c) => c.trim())
            .filter(Boolean);
          if (cells.length === headers.length) {
            // Map each cell to its header: "Rating: 1.0 | Equivalent: 99-100 | Description: Excellent"
            const mapped = headers
              .map((h, idx) => `${h}: ${cells[idx]}`)
              .join(" | ");
            result.push(mapped);
          } else {
            // Can't align columns cleanly, just join as readable text
            result.push(cells.join(", "));
          }
        }
        result.push(`[TABLE END]`);
      } else {
        // Not a real table, just add as-is
        result.push(...tableRows);
      }
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  return result.join("\n");
}
