import { CURRENT_FILE_LINTER_DELAY_MS } from "./linter";

export interface FilenameH1BootstrapSettings {
  lintDelayMs: number;
  runLinterAfterNormalize: boolean;
}

export const DEFAULT_SETTINGS: FilenameH1BootstrapSettings = {
  lintDelayMs: CURRENT_FILE_LINTER_DELAY_MS,
  runLinterAfterNormalize: true
};

export function normalizeLintDelayMs(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return CURRENT_FILE_LINTER_DELAY_MS;
  }

  return Math.max(0, Math.round(value));
}

export function normalizeRunLinterAfterNormalize(value: unknown): boolean {
  if (typeof value !== "boolean") {
    return DEFAULT_SETTINGS.runLinterAfterNormalize;
  }

  return value;
}

export function normalizePluginSettings(
  savedData: Partial<FilenameH1BootstrapSettings> | null | undefined
): FilenameH1BootstrapSettings {
  return {
    lintDelayMs: normalizeLintDelayMs(savedData?.lintDelayMs),
    runLinterAfterNormalize: normalizeRunLinterAfterNormalize(
      savedData?.runLinterAfterNormalize
    )
  };
}

export function buildNormalizeSuccessMessage(options: {
  resultSummary: string;
  runLinterAfterNormalize: boolean;
  lintScheduled: boolean;
  lintDelayMs: number;
}): string {
  const { resultSummary, runLinterAfterNormalize, lintScheduled, lintDelayMs } =
    options;

  if (!runLinterAfterNormalize) {
    return `${resultSummary} 未执行 Linter。`;
  }

  if (lintScheduled) {
    return `标题归一完成，已触发 Linter：格式化当前文件。${lintDelayMs}ms 后执行。`;
  }

  return resultSummary;
}
