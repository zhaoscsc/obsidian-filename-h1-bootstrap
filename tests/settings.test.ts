import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  buildNormalizeSuccessMessage,
  normalizePluginSettings,
  shouldScheduleLinter
} from "../settings";

describe("normalizePluginSettings", () => {
  it("uses defaults when there is no saved data", () => {
    expect(normalizePluginSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it("defaults to changed_only for old saved data without linter mode", () => {
    expect(normalizePluginSettings({ lintDelayMs: 1200 })).toEqual({
      lintDelayMs: 1200,
      linterRunMode: "changed_only"
    });
  });

  it("migrates legacy false to never", () => {
    expect(
      normalizePluginSettings({
        lintDelayMs: 800,
        runLinterAfterNormalize: false
      })
    ).toEqual({
      lintDelayMs: 800,
      linterRunMode: "never"
    });
  });

  it("migrates legacy true to changed_only", () => {
    expect(
      normalizePluginSettings({
        lintDelayMs: 700,
        runLinterAfterNormalize: true
      })
    ).toEqual({
      lintDelayMs: 700,
      linterRunMode: "changed_only"
    });
  });

  it("keeps an explicit new linter mode", () => {
    expect(
      normalizePluginSettings({
        lintDelayMs: 600,
        linterRunMode: "always"
      })
    ).toEqual({
      lintDelayMs: 600,
      linterRunMode: "always"
    });
  });
});

describe("buildNormalizeSuccessMessage", () => {
  it("shows linter trigger text when changed_only mode is scheduled after a change", () => {
    expect(
      buildNormalizeSuccessMessage({
        resultSummary: "已插入 H1。",
        linterRunMode: "changed_only",
        lintScheduled: true,
        lintDelayMs: 500
      })
    ).toContain("已触发 Linter");
  });

  it("shows no-linter text when linter mode is never", () => {
    expect(
      buildNormalizeSuccessMessage({
        resultSummary: "已插入 H1。",
        linterRunMode: "never",
        lintScheduled: false,
        lintDelayMs: 500
      })
    ).toBe("已插入 H1。 未执行 Linter。");
  });

  it("shows no-change but lint-triggered text for always mode", () => {
    expect(
      buildNormalizeSuccessMessage({
        resultSummary: "无需修改。",
        linterRunMode: "always",
        lintScheduled: true,
        lintDelayMs: 500
      })
    ).toBe("无需修改。 已触发 Linter：格式化当前文件。500ms 后执行。");
  });

  it("falls back to the normalization summary when linter should run but was not scheduled", () => {
    expect(
      buildNormalizeSuccessMessage({
        resultSummary: "已插入 H1。",
        linterRunMode: "changed_only",
        lintScheduled: false,
        lintDelayMs: 500
      })
    ).toBe("已插入 H1。");
  });

  it("keeps a rename summary when linting is scheduled", () => {
    expect(
      buildNormalizeSuccessMessage({
        resultSummary: "已将文件名从「旧标题。」重命名为「旧标题」。",
        linterRunMode: "changed_only",
        lintScheduled: true,
        lintDelayMs: 500
      })
    ).toBe("已将文件名从「旧标题。」重命名为「旧标题」。 已触发 Linter：格式化当前文件。500ms 后执行。");
  });
});

describe("shouldScheduleLinter", () => {
  it("returns false in never mode", () => {
    expect(shouldScheduleLinter("never", true)).toBe(false);
    expect(shouldScheduleLinter("never", false)).toBe(false);
  });

  it("returns true only when changed in changed_only mode", () => {
    expect(shouldScheduleLinter("changed_only", true)).toBe(true);
    expect(shouldScheduleLinter("changed_only", false)).toBe(false);
  });

  it("returns true in always mode regardless of changes", () => {
    expect(shouldScheduleLinter("always", true)).toBe(true);
    expect(shouldScheduleLinter("always", false)).toBe(true);
  });
});
