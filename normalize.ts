export interface NormalizeResult {
  changed: boolean;
  content: string;
  summary: string;
  notice?: string;
}

const TRAILING_FILENAME_PUNCTUATION_PATTERN = /[ \t]*[.,;:!。，；：！]+[ \t]*$/u;

interface HeadingMatch {
  indent: string;
  level: number;
  text: string;
}

interface HeadingEntry extends HeadingMatch {
  lineIndex: number;
}

const BLANK_LINE = "";
const FENCE_PATTERN = /^( {0,3})(`{3,}|~{3,})(.*)$/;
const ATX_HEADING_PATTERN = /^( {0,3})(#{1,6})[ \t]+(.*)$/;

function detectNewline(content: string): string {
  return content.includes("\r\n") ? "\r\n" : "\n";
}

function parseFrontmatterEnd(lines: string[]): number {
  if (lines.length === 0 || lines[0] !== "---") {
    return 0;
  }

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index] === "---") {
      return index + 1;
    }
  }

  return 0;
}

function skipBlankLines(lines: string[], start: number): number {
  let index = start;
  while (index < lines.length && lines[index].trim() === "") {
    index += 1;
  }
  return index;
}

function normalizeHeadingText(rawText: string): string {
  return rawText.replace(/[ \t]+#+[ \t]*$/, "").trim();
}

function sanitizeComparableTitleText(text: string): string {
  return text.replace(TRAILING_FILENAME_PUNCTUATION_PATTERN, "");
}

function parseAtxHeading(line: string): HeadingMatch | null {
  const match = line.match(ATX_HEADING_PATTERN);
  if (!match) {
    return null;
  }

  const text = normalizeHeadingText(match[3]);
  if (!text) {
    return null;
  }

  return {
    indent: match[1],
    level: match[2].length,
    text
  };
}

function buildHeadingLine(indent: string, level: number, text: string): string {
  const safeLevel = Math.min(level, 6);
  return `${indent}${"#".repeat(safeLevel)} ${text}`;
}

function updateFenceState(line: string, fence: string | null): string | null {
  const match = line.match(FENCE_PATTERN);
  if (!match) {
    return fence;
  }

  const marker = match[2];
  const fenceKey = marker[0].repeat(marker.length);

  if (fence === null) {
    return fenceKey;
  }

  if (marker[0] === fence[0] && marker.length >= fence.length) {
    return null;
  }

  return fence;
}

function collectAtxHeadings(lines: string[], start: number): HeadingEntry[] {
  const headings: HeadingEntry[] = [];
  let fence: string | null = null;

  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index];
    const nextFence = updateFenceState(line, fence);

    if (fence === null) {
      const heading = parseAtxHeading(line);
      if (heading) {
        headings.push({
          ...heading,
          lineIndex: index
        });
      }
    }

    fence = nextFence;
  }

  return headings;
}

function hasPotentialSetextHeading(lines: string[], start: number): boolean {
  let fence: string | null = null;
  const lastIndex = Math.min(lines.length - 1, start + 80);

  for (let index = start; index < lastIndex; index += 1) {
    const line = lines[index];
    const nextFence = updateFenceState(line, fence);

    if (fence === null) {
      const current = line.trim();
      const next = lines[index + 1]?.trim() ?? "";

      if (current && !current.startsWith("#")) {
        const looksSetext =
          /^={3,}$/.test(next) ||
          (/^-{3,}$/.test(next) &&
            !current.startsWith("-") &&
            !current.startsWith("*") &&
            !current.startsWith(">") &&
            !current.startsWith("```") &&
            !current.startsWith("~~~"));

        if (looksSetext) {
          return true;
        }
      }
    }

    fence = nextFence;
  }

  return false;
}

function summarizeInsert(demotedCount: number, title: string): string {
  if (demotedCount > 0) {
    return `已插入 H1「${title}」，并降级 ${demotedCount} 个标题。`;
  }
  return `已插入 H1「${title}」。`;
}

function ensureSingleBlankLineAfterHeading(
  lines: string[],
  headingIndex: number
): { lines: string[]; changed: boolean } {
  let nextContentIndex = headingIndex + 1;

  while (nextContentIndex < lines.length && lines[nextContentIndex].trim() === "") {
    nextContentIndex += 1;
  }

  if (nextContentIndex >= lines.length) {
    return { lines, changed: false };
  }

  const blankCount = nextContentIndex - (headingIndex + 1);
  if (blankCount === 1) {
    return { lines, changed: false };
  }

  return {
    lines: [
      ...lines.slice(0, headingIndex + 1),
      BLANK_LINE,
      ...lines.slice(nextContentIndex)
    ],
    changed: true
  };
}

function promoteTopMatchingH2(
  lines: string[],
  headingIndex: number,
  fileBasename: string,
  newline: string
): NormalizeResult {
  const nextLines = [...lines];
  nextLines[headingIndex] = buildHeadingLine("", 1, fileBasename);

  const spacingResult = ensureSingleBlankLineAfterHeading(nextLines, headingIndex);

  return {
    changed: true,
    content: spacingResult.lines.join(newline),
    summary: spacingResult.changed
      ? `已将开头同名 H2 提升为 H1「${fileBasename}」，并规范标题后的空行。`
      : `已将开头同名 H2 提升为 H1「${fileBasename}」。`
  };
}

function normalizeTopEquivalentHeading(
  lines: string[],
  headingIndex: number,
  fileBasename: string,
  newline: string,
  previousLevel: 1 | 2
): NormalizeResult {
  const nextLines = [...lines];
  nextLines[headingIndex] = buildHeadingLine("", 1, fileBasename);

  const spacingResult = ensureSingleBlankLineAfterHeading(nextLines, headingIndex);
  const headingSummary =
    previousLevel === 1
      ? `已将开头 H1 标题规范为「${fileBasename}」。`
      : `已将开头同名 H2 提升为 H1「${fileBasename}」。`;

  return {
    changed: true,
    content: spacingResult.lines.join(newline),
    summary: spacingResult.changed
      ? `${headingSummary.slice(0, -1)}，并规范标题后的空行。`
      : headingSummary
  };
}

export function normalizeMarkdownTitleHeading(
  content: string,
  fileBasename: string
): NormalizeResult {
  const newline = detectNewline(content);
  const lines = content.split(/\r?\n/);
  const frontmatterEnd = parseFrontmatterEnd(lines);
  const bodyStart = skipBlankLines(lines, frontmatterEnd);

  if (bodyStart >= lines.length) {
    const prefix = lines.slice(0, bodyStart);
    const nextLines = prefix.length > 0 ? [...prefix, `# ${fileBasename}`] : [`# ${fileBasename}`];
    return {
      changed: true,
      content: nextLines.join(newline),
      summary: `已为“${fileBasename}”创建唯一 H1。`
    };
  }

  if (hasPotentialSetextHeading(lines, bodyStart) && collectAtxHeadings(lines, bodyStart).length === 0) {
    return {
      changed: false,
      content,
      summary: "",
      notice: "检测到可能的 Setext 标题，当前版本已跳过。"
    };
  }

  const headings = collectAtxHeadings(lines, bodyStart);
  const firstBodyLineIndex = bodyStart;
  const firstBodyHeading = parseAtxHeading(lines[firstBodyLineIndex]);
  const firstBodyHeadingComparableText =
    firstBodyHeading === null ? "" : sanitizeComparableTitleText(firstBodyHeading.text);
  const topEquivalentH1 =
    firstBodyHeading !== null &&
    firstBodyHeading.level === 1 &&
    firstBodyHeading.text !== fileBasename &&
    firstBodyHeadingComparableText === fileBasename;
  const topEquivalentH2 =
    firstBodyHeading !== null &&
    firstBodyHeading.level === 2 &&
    firstBodyHeadingComparableText === fileBasename;
  const topTitleMatches =
    firstBodyHeading !== null &&
    firstBodyHeading.level === 1 &&
    firstBodyHeading.text === fileBasename;
  const topMatchingH2 =
    firstBodyHeading !== null &&
    firstBodyHeading.level === 2 &&
    firstBodyHeading.text === fileBasename;

  const h1Headings = headings.filter((heading) => heading.level === 1);
  const hasAnyH1 = h1Headings.length > 0;

  if (topTitleMatches) {
    const spacingResult = ensureSingleBlankLineAfterHeading(lines, firstBodyLineIndex);
    return {
      changed: spacingResult.changed,
      content: spacingResult.lines.join(newline),
      summary: spacingResult.changed
        ? `已规范顶部 H1「${fileBasename}」与正文之间的空行。`
        : `无需修改，顶部 H1 已与文件名“${fileBasename}”一致。`
    };
  }

  if (topEquivalentH1) {
    return normalizeTopEquivalentHeading(lines, firstBodyLineIndex, fileBasename, newline, 1);
  }

  if (topMatchingH2) {
    return promoteTopMatchingH2(lines, firstBodyLineIndex, fileBasename, newline);
  }

  if (topEquivalentH2) {
    return normalizeTopEquivalentHeading(lines, firstBodyLineIndex, fileBasename, newline, 2);
  }

  const nextLines = [...lines];
  let demotedCount = 0;

  if (hasAnyH1) {
    for (const heading of headings) {
      nextLines[heading.lineIndex] = buildHeadingLine(
        heading.indent,
        heading.level + 1,
        heading.text
      );
      demotedCount += 1;
    }
  }

  const prefix = nextLines.slice(0, bodyStart);
  const body = nextLines.slice(bodyStart);
  const nextContentLines =
    body.length > 0
      ? [...prefix, `# ${fileBasename}`, BLANK_LINE, ...body]
      : [...prefix, `# ${fileBasename}`];

  return {
    changed: true,
    content: nextContentLines.join(newline),
    summary: hasAnyH1
      ? summarizeInsert(demotedCount, fileBasename)
      : `已插入 H1「${fileBasename}」，原有 H2-H6 保持不变。`
  };
}
