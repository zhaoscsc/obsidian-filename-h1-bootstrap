export interface NormalizeResult {
  changed: boolean;
  content: string;
  summary: string;
  notice?: string;
}

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
  const topTitleMatches =
    firstBodyHeading !== null &&
    firstBodyHeading.level === 1 &&
    firstBodyHeading.text === fileBasename;

  const h1Headings = headings.filter((heading) => heading.level === 1);
  const hasAnyH1 = h1Headings.length > 0;

  if (topTitleMatches && h1Headings.length === 1) {
    const spacingResult = ensureSingleBlankLineAfterHeading(lines, firstBodyLineIndex);
    return {
      changed: spacingResult.changed,
      content: spacingResult.lines.join(newline),
      summary: spacingResult.changed
        ? `已规范顶部 H1「${fileBasename}」与正文之间的空行。`
        : `无需修改，顶部 H1 已与文件名“${fileBasename}”一致。`
    };
  }

  const nextLines = [...lines];
  let demotedCount = 0;

  if (topTitleMatches) {
    for (const heading of headings) {
      if (heading.lineIndex === firstBodyLineIndex) {
        continue;
      }

      nextLines[heading.lineIndex] = buildHeadingLine(
        heading.indent,
        heading.level + 1,
        heading.text
      );
      demotedCount += 1;
    }

    const spacingResult = ensureSingleBlankLineAfterHeading(nextLines, firstBodyLineIndex);

    return {
      changed: demotedCount > 0 || spacingResult.changed,
      content: spacingResult.lines.join(newline),
      summary:
        demotedCount > 0 && spacingResult.changed
          ? `保留顶部 H1「${fileBasename}」，并降级 ${demotedCount} 个后续标题，同时补齐标题后的空行。`
          : demotedCount > 0
            ? `保留顶部 H1「${fileBasename}」，并降级 ${demotedCount} 个后续标题。`
            : spacingResult.changed
              ? `已规范顶部 H1「${fileBasename}」与正文之间的空行。`
              : `无需修改，顶部 H1 已与文件名“${fileBasename}”一致。`
    };
  }

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
