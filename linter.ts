export const CURRENT_FILE_LINTER_COMMAND_ID = "obsidian-linter:lint-file";
export const CURRENT_FILE_LINTER_DELAY_MS = 500;

export const LINTER_MISSING_NOTICE =
  "未检测到 Linter：格式化当前文件命令，已跳过自动格式化。";
export const LINTER_FAILED_NOTICE = "Linter 执行失败，标题归一已完成。";

interface ScheduleCurrentFileLintDeps {
  hasCommand: (commandId: string) => boolean;
  getActiveFilePath: () => string | null;
  executeCommandById: (commandId: string) => Promise<unknown> | unknown;
  notify: (message: string) => void;
  setTimer?: (callback: () => void | Promise<void>, delayMs: number) => unknown;
  logError?: (message: string, error: unknown) => void;
}

export function scheduleCurrentFileLint(
  targetFilePath: string,
  deps: ScheduleCurrentFileLintDeps,
  delayMs = CURRENT_FILE_LINTER_DELAY_MS
): boolean {
  if (!deps.hasCommand(CURRENT_FILE_LINTER_COMMAND_ID)) {
    deps.notify(LINTER_MISSING_NOTICE);
    return false;
  }

  const setTimer =
    deps.setTimer ??
    ((callback: () => void | Promise<void>, waitMs: number) => {
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
