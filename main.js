"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => FilenameH1BootstrapPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// linter.ts
var CURRENT_FILE_LINTER_COMMAND_ID = "obsidian-linter:lint-file";
var CURRENT_FILE_LINTER_DELAY_MS = 500;
var LINTER_MISSING_NOTICE = "\u672A\u68C0\u6D4B\u5230 Linter\uFF1A\u683C\u5F0F\u5316\u5F53\u524D\u6587\u4EF6\u547D\u4EE4\uFF0C\u5DF2\u8DF3\u8FC7\u81EA\u52A8\u683C\u5F0F\u5316\u3002";
var LINTER_FAILED_NOTICE = "Linter \u6267\u884C\u5931\u8D25\uFF0C\u6807\u9898\u5F52\u4E00\u5DF2\u5B8C\u6210\u3002";
function scheduleCurrentFileLint(targetFilePath, deps, delayMs = CURRENT_FILE_LINTER_DELAY_MS) {
  if (!deps.hasCommand(CURRENT_FILE_LINTER_COMMAND_ID)) {
    deps.notify(LINTER_MISSING_NOTICE);
    return false;
  }
  const setTimer = deps.setTimer ?? ((callback, waitMs) => {
    return globalThis.setTimeout(() => {
      void callback();
    }, waitMs);
  });
  setTimer(async () => {
    if (deps.getActiveFilePath() !== targetFilePath) {
      return;
    }
    try {
      await deps.executeCommandById(CURRENT_FILE_LINTER_COMMAND_ID);
    } catch (error) {
      deps.notify(LINTER_FAILED_NOTICE);
      deps.logError?.(
        "[obsidian-filename-h1-bootstrap] Failed to run Linter current-file command.",
        error
      );
    }
  }, delayMs);
  return true;
}

// normalize.ts
var BLANK_LINE = "";
var FENCE_PATTERN = /^( {0,3})(`{3,}|~{3,})(.*)$/;
var ATX_HEADING_PATTERN = /^( {0,3})(#{1,6})[ \t]+(.*)$/;
function detectNewline(content) {
  return content.includes("\r\n") ? "\r\n" : "\n";
}
function parseFrontmatterEnd(lines) {
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
function skipBlankLines(lines, start) {
  let index = start;
  while (index < lines.length && lines[index].trim() === "") {
    index += 1;
  }
  return index;
}
function normalizeHeadingText(rawText) {
  return rawText.replace(/[ \t]+#+[ \t]*$/, "").trim();
}
function parseAtxHeading(line) {
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
function buildHeadingLine(indent, level, text) {
  const safeLevel = Math.min(level, 6);
  return `${indent}${"#".repeat(safeLevel)} ${text}`;
}
function updateFenceState(line, fence) {
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
function collectAtxHeadings(lines, start) {
  const headings = [];
  let fence = null;
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
function hasPotentialSetextHeading(lines, start) {
  let fence = null;
  const lastIndex = Math.min(lines.length - 1, start + 80);
  for (let index = start; index < lastIndex; index += 1) {
    const line = lines[index];
    const nextFence = updateFenceState(line, fence);
    if (fence === null) {
      const current = line.trim();
      const next = lines[index + 1]?.trim() ?? "";
      if (current && !current.startsWith("#")) {
        const looksSetext = /^={3,}$/.test(next) || /^-{3,}$/.test(next) && !current.startsWith("-") && !current.startsWith("*") && !current.startsWith(">") && !current.startsWith("```") && !current.startsWith("~~~");
        if (looksSetext) {
          return true;
        }
      }
    }
    fence = nextFence;
  }
  return false;
}
function summarizeInsert(demotedCount, title) {
  if (demotedCount > 0) {
    return `\u5DF2\u63D2\u5165 H1\u300C${title}\u300D\uFF0C\u5E76\u964D\u7EA7 ${demotedCount} \u4E2A\u6807\u9898\u3002`;
  }
  return `\u5DF2\u63D2\u5165 H1\u300C${title}\u300D\u3002`;
}
function ensureSingleBlankLineAfterHeading(lines, headingIndex) {
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
function normalizeMarkdownTitleHeading(content, fileBasename) {
  const newline = detectNewline(content);
  const lines = content.split(/\r?\n/);
  const frontmatterEnd = parseFrontmatterEnd(lines);
  const bodyStart = skipBlankLines(lines, frontmatterEnd);
  if (bodyStart >= lines.length) {
    const prefix2 = lines.slice(0, bodyStart);
    const nextLines2 = prefix2.length > 0 ? [...prefix2, `# ${fileBasename}`] : [`# ${fileBasename}`];
    return {
      changed: true,
      content: nextLines2.join(newline),
      summary: `\u5DF2\u4E3A\u201C${fileBasename}\u201D\u521B\u5EFA\u552F\u4E00 H1\u3002`
    };
  }
  if (hasPotentialSetextHeading(lines, bodyStart) && collectAtxHeadings(lines, bodyStart).length === 0) {
    return {
      changed: false,
      content,
      summary: "",
      notice: "\u68C0\u6D4B\u5230\u53EF\u80FD\u7684 Setext \u6807\u9898\uFF0C\u5F53\u524D\u7248\u672C\u5DF2\u8DF3\u8FC7\u3002"
    };
  }
  const headings = collectAtxHeadings(lines, bodyStart);
  const firstBodyLineIndex = bodyStart;
  const firstBodyHeading = parseAtxHeading(lines[firstBodyLineIndex]);
  const topTitleMatches = firstBodyHeading !== null && firstBodyHeading.level === 1 && firstBodyHeading.text === fileBasename;
  const h1Headings = headings.filter((heading) => heading.level === 1);
  const hasAnyH1 = h1Headings.length > 0;
  if (topTitleMatches) {
    const spacingResult = ensureSingleBlankLineAfterHeading(lines, firstBodyLineIndex);
    return {
      changed: spacingResult.changed,
      content: spacingResult.lines.join(newline),
      summary: spacingResult.changed ? `\u5DF2\u89C4\u8303\u9876\u90E8 H1\u300C${fileBasename}\u300D\u4E0E\u6B63\u6587\u4E4B\u95F4\u7684\u7A7A\u884C\u3002` : `\u65E0\u9700\u4FEE\u6539\uFF0C\u9876\u90E8 H1 \u5DF2\u4E0E\u6587\u4EF6\u540D\u201C${fileBasename}\u201D\u4E00\u81F4\u3002`
    };
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
  const nextContentLines = body.length > 0 ? [...prefix, `# ${fileBasename}`, BLANK_LINE, ...body] : [...prefix, `# ${fileBasename}`];
  return {
    changed: true,
    content: nextContentLines.join(newline),
    summary: hasAnyH1 ? summarizeInsert(demotedCount, fileBasename) : `\u5DF2\u63D2\u5165 H1\u300C${fileBasename}\u300D\uFF0C\u539F\u6709 H2-H6 \u4FDD\u6301\u4E0D\u53D8\u3002`
  };
}

// settings.ts
var DEFAULT_SETTINGS = {
  lintDelayMs: CURRENT_FILE_LINTER_DELAY_MS,
  linterRunMode: "changed_only"
};
function normalizeLintDelayMs(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return CURRENT_FILE_LINTER_DELAY_MS;
  }
  return Math.max(0, Math.round(value));
}
function normalizeLinterRunMode(value, legacyRunLinterAfterNormalize) {
  if (value === "never" || value === "changed_only" || value === "always") {
    return value;
  }
  if (typeof legacyRunLinterAfterNormalize === "boolean") {
    return legacyRunLinterAfterNormalize ? "changed_only" : "never";
  }
  return DEFAULT_SETTINGS.linterRunMode;
}
function normalizePluginSettings(savedData) {
  return {
    lintDelayMs: normalizeLintDelayMs(savedData?.lintDelayMs),
    linterRunMode: normalizeLinterRunMode(
      savedData?.linterRunMode,
      savedData?.runLinterAfterNormalize
    )
  };
}
function buildNormalizeSuccessMessage(options) {
  const { resultSummary, linterRunMode, lintScheduled, lintDelayMs } = options;
  if (linterRunMode === "never") {
    return `${resultSummary} \u672A\u6267\u884C Linter\u3002`;
  }
  if (lintScheduled) {
    return `${resultSummary} \u5DF2\u89E6\u53D1 Linter\uFF1A\u683C\u5F0F\u5316\u5F53\u524D\u6587\u4EF6\u3002${lintDelayMs}ms \u540E\u6267\u884C\u3002`;
  }
  return resultSummary;
}
function shouldScheduleLinter(linterRunMode, changed) {
  if (linterRunMode === "never") {
    return false;
  }
  if (linterRunMode === "always") {
    return true;
  }
  return changed;
}

// title.ts
var TRAILING_FILENAME_PUNCTUATION_PATTERN = /[ \t]*[.,;:!。，；：！]+[ \t]*$/u;
function sanitizeFilenameBasename(fileBasename) {
  return fileBasename.replace(TRAILING_FILENAME_PUNCTUATION_PATTERN, "");
}
function buildRenamedFilePath(filePath, oldBasename, newBasename, extension) {
  const oldFileName = `${oldBasename}.${extension}`;
  if (!filePath.endsWith(oldFileName)) {
    return filePath;
  }
  return `${filePath.slice(0, -oldFileName.length)}${newBasename}.${extension}`;
}

// main.ts
var FilenameH1BootstrapPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    await this.loadSettings();
    this.addCommand({
      id: "normalize-current-note-title-heading",
      name: "Normalize current note title heading",
      callback: async () => {
        await this.normalizeCurrentNote();
      }
    });
    this.addSettingTab(new FilenameH1BootstrapSettingTab(this.app, this));
  }
  async loadSettings() {
    const savedData = await this.loadData();
    this.settings = normalizePluginSettings(savedData);
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async normalizeCurrentNote() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    const file = view?.file;
    if (!view || !file || file.extension !== "md") {
      new import_obsidian.Notice("\u5F53\u524D\u6CA1\u6709\u53EF\u5904\u7406\u7684 Markdown \u7B14\u8BB0\u3002");
      return;
    }
    try {
      await view.save();
    } catch (error) {
      new import_obsidian.Notice("\u5F53\u524D\u7B14\u8BB0\u4FDD\u5B58\u5931\u8D25\uFF0C\u5DF2\u8DF3\u8FC7\u5904\u7406\u3002");
      console.error("[obsidian-filename-h1-bootstrap] Failed to save current note.", error);
      return;
    }
    const sanitizedBasename = sanitizeFilenameBasename(file.basename);
    let targetFile = file;
    let renameSummary = "";
    let renamed = false;
    if (sanitizedBasename && sanitizedBasename !== file.basename) {
      const nextPath = buildRenamedFilePath(
        file.path,
        file.basename,
        sanitizedBasename,
        file.extension
      );
      try {
        await this.app.fileManager.renameFile(file, nextPath);
        targetFile = this.app.workspace.getActiveFile() ?? file;
        renamed = true;
        renameSummary = `\u5DF2\u5C06\u6587\u4EF6\u540D\u4ECE\u300C${file.basename}\u300D\u91CD\u547D\u540D\u4E3A\u300C${sanitizedBasename}\u300D\u3002`;
      } catch (error) {
        new import_obsidian.Notice("\u5F53\u524D\u7B14\u8BB0\u91CD\u547D\u540D\u5931\u8D25\uFF0C\u5DF2\u8DF3\u8FC7\u5904\u7406\u3002");
        console.error("[obsidian-filename-h1-bootstrap] Failed to rename current note.", error);
        return;
      }
    }
    const originalContent = await this.app.vault.read(targetFile);
    const result = normalizeMarkdownTitleHeading(originalContent, sanitizedBasename || targetFile.basename);
    if (result.notice) {
      new import_obsidian.Notice(result.notice);
      return;
    }
    if (result.changed) {
      await this.app.vault.modify(targetFile, result.content);
    }
    const commandChanged = renamed || result.changed;
    const resultSummary = renamed && result.changed ? `${renameSummary} ${result.summary}` : renamed ? renameSummary : result.summary;
    const lintScheduled = shouldScheduleLinter(this.settings.linterRunMode, commandChanged) ? scheduleCurrentFileLint(
      targetFile.path,
      {
        hasCommand: (commandId) => Boolean(this.app.commands?.commands?.[commandId]),
        getActiveFilePath: () => this.app.workspace.getActiveFile()?.path ?? null,
        executeCommandById: (commandId) => this.app.commands.executeCommandById(commandId),
        notify: (message) => {
          new import_obsidian.Notice(message);
        },
        logError: (message, error) => {
          console.error(message, error);
        }
      },
      this.settings.lintDelayMs
    ) : false;
    if (!commandChanged && !lintScheduled) {
      new import_obsidian.Notice(resultSummary);
      return;
    }
    const successMessage = buildNormalizeSuccessMessage({
      resultSummary,
      linterRunMode: this.settings.linterRunMode,
      lintScheduled,
      lintDelayMs: this.settings.lintDelayMs
    });
    new import_obsidian.Notice(successMessage);
  }
};
var FilenameH1BootstrapSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Linter \u6267\u884C\u6A21\u5F0F").setDesc("\u63A7\u5236\u6807\u9898\u5F52\u4E00\u547D\u4EE4\u6267\u884C\u540E\uFF0C\u5F53\u524D\u6587\u4EF6\u7684 Linter \u89E6\u53D1\u65B9\u5F0F\u3002").addDropdown((dropdown) => {
      dropdown.addOption("never", "\u4E0D\u6267\u884C").addOption("changed_only", "\u4EC5\u4FEE\u6539\u65F6\u6267\u884C").addOption("always", "\u59CB\u7EC8\u6267\u884C").setValue(this.plugin.settings.linterRunMode).onChange(async (value) => {
        this.plugin.settings = normalizePluginSettings({
          ...this.plugin.settings,
          linterRunMode: value
        });
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Linter \u5EF6\u8FDF\u65F6\u95F4").setDesc("\u4EC5\u5728 Linter \u6267\u884C\u6A21\u5F0F\u4E0D\u662F\u201C\u4E0D\u6267\u884C\u201D\u65F6\u751F\u6548\u3002").addText((text) => {
      text.setPlaceholder(String(CURRENT_FILE_LINTER_DELAY_MS)).setValue(String(this.plugin.settings.lintDelayMs)).onChange(async (value) => {
        const parsedValue = Number(value.trim());
        this.plugin.settings = normalizePluginSettings({
          ...this.plugin.settings,
          lintDelayMs: parsedValue
        });
        await this.plugin.saveSettings();
        text.setValue(String(this.plugin.settings.lintDelayMs));
      });
    });
  }
};
