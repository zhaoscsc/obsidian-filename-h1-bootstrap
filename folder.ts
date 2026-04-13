import { App, Notice, TAbstractFile, TFile } from "obsidian";
import { normalizeMarkdownTitleHeading } from "./normalize";
import { buildRenamedFilePath, sanitizeFilenameBasename } from "./title";

export interface FolderNormalizeResult {
  total: number;
  changed: number;
  renamed: number;
  failed: number;
  details: Array<{ path: string; summary: string }>;
}

/** Type guard: checks if an abstract file is a folder (has children array) */
function isFolder(file: TAbstractFile): file is TAbstractFile & { children: TAbstractFile[] } {
  return "children" in file && Array.isArray((file as TAbstractFile & { children: unknown }).children);
}

/** Type guard: checks if an abstract file is a markdown file */
function isMarkdownFile(file: TAbstractFile): file is TFile {
  return file instanceof TFile && file.extension === "md";
}

function collectMarkdownFiles(folder: TAbstractFile, recursive: boolean): TFile[] {
  if (!isFolder(folder)) return [];

  const files: TFile[] = [];
  for (const child of folder.children) {
    if (isMarkdownFile(child)) {
      files.push(child);
    } else if (recursive && isFolder(child)) {
      files.push(...collectMarkdownFiles(child, true));
    }
  }
  return files;
}

async function processFile(
  app: App,
  file: TFile
): Promise<{ renamed: boolean; changed: boolean; summary: string } | null> {
  const sanitizedBasename = sanitizeFilenameBasename(file.basename);
  let targetFile = file;
  let renamed = false;
  let renameSummary = "";

  // Handle filename sanitization and rename
  if (sanitizedBasename && sanitizedBasename !== file.basename) {
    const nextPath = buildRenamedFilePath(
      file.path,
      file.basename,
      sanitizedBasename,
      file.extension
    );

    try {
      await app.fileManager.renameFile(file, nextPath);
      targetFile = app.vault.getAbstractFileByPath(nextPath) as TFile;
      renamed = true;
      renameSummary = `已重命名「${file.basename}」→「${sanitizedBasename}」。`;
    } catch (error) {
      console.error(
        "[obsidian-filename-h1-bootstrap] Failed to rename file:",
        file.path,
        error
      );
      return null;
    }
  }

  // Handle content normalization
  const originalContent = await app.vault.read(targetFile);
  const result = normalizeMarkdownTitleHeading(
    originalContent,
    sanitizedBasename || targetFile.basename
  );

  if (result.notice) {
    return null;
  }

  if (result.changed) {
    await app.vault.modify(targetFile, result.content);
  }

  const commandChanged = renamed || result.changed;
  const resultSummary =
    renamed && result.changed
      ? `${renameSummary} ${result.summary}`
      : renamed
        ? renameSummary
        : result.summary;

  return { renamed, changed: commandChanged, summary: resultSummary };
}

export async function normalizeFolder(
  app: App,
  folder: TAbstractFile,
  options: { recursive: boolean }
): Promise<FolderNormalizeResult> {
  const files = collectMarkdownFiles(folder, options.recursive);

  if (files.length === 0) {
    new Notice(`文件夹「${folder.name}」中没有 Markdown 文件。`);
    return { total: 0, changed: 0, renamed: 0, failed: 0, details: [] };
  }

  let changed = 0;
  let renamed = 0;
  let failed = 0;
  const details: Array<{ path: string; summary: string }> = [];

  for (const file of files) {
    const result = await processFile(app, file);

    if (result === null) {
      failed += 1;
    } else {
      if (result.changed) changed += 1;
      if (result.renamed) renamed += 1;
      details.push({ path: file.path, summary: result.summary });
    }
  }

  const modeText = options.recursive ? "递归" : "非递归";
  new Notice(
    `文件夹归一化完成（${modeText}）：处理 ${files.length} 个文件，${changed} 个有变化，${renamed} 个重命名，${failed} 个失败。`
  );

  return { total: files.length, changed, renamed, failed, details };
}
