import { describe, expect, it, vi } from "vitest";
import {
  CURRENT_FILE_LINTER_COMMAND_ID,
  CURRENT_FILE_LINTER_DELAY_MS,
  LINTER_FAILED_NOTICE,
  LINTER_MISSING_NOTICE,
  normalizeLintDelayMs,
  scheduleCurrentFileLint
} from "../linter";

describe("scheduleCurrentFileLint", () => {
  it("does not schedule when the linter command is missing", () => {
    const notify = vi.fn();
    const setTimer = vi.fn();

    const scheduled = scheduleCurrentFileLint("a.md", {
      hasCommand: () => false,
      getActiveFilePath: () => "a.md",
      executeCommandById: vi.fn(),
      notify,
      setTimer
    });

    expect(scheduled).toBe(false);
    expect(notify).toHaveBeenCalledWith(LINTER_MISSING_NOTICE);
    expect(setTimer).not.toHaveBeenCalled();
  });

  it("schedules lint-file with the default 500ms delay", async () => {
    let timerCallback: (() => void | Promise<void>) | null = null;
    let timerDelay = -1;
    const executeCommandById = vi.fn();

    const scheduled = scheduleCurrentFileLint("a.md", {
      hasCommand: (commandId) => commandId === CURRENT_FILE_LINTER_COMMAND_ID,
      getActiveFilePath: () => "a.md",
      executeCommandById,
      notify: vi.fn(),
      setTimer: (callback, delayMs) => {
        timerCallback = callback;
        timerDelay = delayMs;
        return 1;
      }
    });

    expect(scheduled).toBe(true);
    expect(timerDelay).toBe(CURRENT_FILE_LINTER_DELAY_MS);

    await timerCallback?.();

    expect(executeCommandById).toHaveBeenCalledWith(CURRENT_FILE_LINTER_COMMAND_ID);
  });

  it("uses the fully qualified obsidian linter command id", () => {
    expect(CURRENT_FILE_LINTER_COMMAND_ID).toBe("obsidian-linter:lint-file");
  });

  it("skips linting if the active file changed before the delay elapsed", async () => {
    let timerCallback: (() => void | Promise<void>) | null = null;
    const executeCommandById = vi.fn();

    scheduleCurrentFileLint("a.md", {
      hasCommand: () => true,
      getActiveFilePath: () => "b.md",
      executeCommandById,
      notify: vi.fn(),
      setTimer: (callback) => {
        timerCallback = callback;
        return 1;
      }
    });

    await timerCallback?.();

    expect(executeCommandById).not.toHaveBeenCalled();
  });

  it("reports a light notice when lint execution fails", async () => {
    let timerCallback: (() => void | Promise<void>) | null = null;
    const notify = vi.fn();
    const logError = vi.fn();

    scheduleCurrentFileLint("a.md", {
      hasCommand: () => true,
      getActiveFilePath: () => "a.md",
      executeCommandById: () => {
        throw new Error("boom");
      },
      notify,
      setTimer: (callback) => {
        timerCallback = callback;
        return 1;
      },
      logError
    });

    await timerCallback?.();

    expect(notify).toHaveBeenCalledWith(LINTER_FAILED_NOTICE);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("normalizes custom lint delay values", () => {
    expect(normalizeLintDelayMs(undefined)).toBe(CURRENT_FILE_LINTER_DELAY_MS);
    expect(normalizeLintDelayMs(Number.NaN)).toBe(CURRENT_FILE_LINTER_DELAY_MS);
    expect(normalizeLintDelayMs(-120)).toBe(0);
    expect(normalizeLintDelayMs(1234.4)).toBe(1234);
  });
});
