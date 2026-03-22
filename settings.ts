import { CURRENT_FILE_LINTER_DELAY_MS } from "./linter";

export type LinterRunMode = "never" | "changed_only" | "always";

export interface FilenameH1BootstrapSettings {
  lintDelayMs: number;
  linterRunMode: LinterRunMode;
}

export const DEFAULT_SETTINGS: FilenameH1BootstrapSettings = {
  lintDelayMs: CURRENT_FILE_LINTER_DELAY_MS,
  linterRunMode: "changed_only"
};

export function normalizeLintDelayMs(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return CURRENT_FILE_LINTER_DELAY_MS;
  }

  return Math.max(0, Math.round(value));
}

export function normalizeLinterRunMode(
  value: unknown,
  legacyRunLinterAfterNormalize?: unknown
): LinterRunMode {
  if (value === "never" || value === "changed_only" || value === "always") {
    return value;
  }

  if (typeof legacyRunLinterAfterNormalize === "boolean") {
    return legacyRunLinterAfterNormalize ? "changed_only" : "never";
  }

  return DEFAULT_SETTINGS.linterRunMode;
}

export function normalizePluginSettings(
  savedData:
    | (Partial<FilenameH1BootstrapSettings> & {
        runLinterAfterNormalize?: unknown;
      })
    | null
    | undefined
): FilenameH1BootstrapSettings {
  return {
    lintDelayMs: normalizeLintDelayMs(savedData?.lintDelayMs),
    linterRunMode: normalizeLinterRunMode(
      savedData?.linterRunMode,
      savedData?.runLinterAfterNormalize
    )
  };
}

export function buildNormalizeSuccessMessage(options: {
  resultSummary: string;
  changed: boolean;
  linterRunMode: LinterRunMode;
  lintScheduled: boolean;
  lintDelayMs: number;
}): string {
  const { resultSummary, changed, linterRunMode, lintScheduled, lintDelayMs } = options;

  if (linterRunMode === "never") {
    return `${resultSummary} 未执行 Linter。`;
  }

  if (lintScheduled) {
    if (!changed) {
      return `${resultSummary} 已触发 Linter：格式化当前文件。${lintDelayMs}ms 后执行。`;
    }

    return `标题归一完成，已触发 Linter：格式化当前文件。${lintDelayMs}ms 后执行。`;
  }

  return resultSummary;
}

export function shouldScheduleLinter(
  linterRunMode: LinterRunMode,
  changed: boolean
): boolean {
  if (linterRunMode === "never") {
    return false;
  }

  if (linterRunMode === "always") {
    return true;
  }

  return changed;
}
