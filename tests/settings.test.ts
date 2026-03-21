import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  buildNormalizeSuccessMessage,
  normalizePluginSettings
} from "../settings";

describe("normalizePluginSettings", () => {
  it("uses defaults when there is no saved data", () => {
    expect(normalizePluginSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps linter enabled by default for old saved data", () => {
    expect(normalizePluginSettings({ lintDelayMs: 1200 })).toEqual({
      lintDelayMs: 1200,
      runLinterAfterNormalize: true
    });
  });

  it("respects an explicit disabled linter setting", () => {
    expect(
      normalizePluginSettings({
        lintDelayMs: 800,
        runLinterAfterNormalize: false
      })
    ).toEqual({
      lintDelayMs: 800,
      runLinterAfterNormalize: false
    });
  });
});

describe("buildNormalizeSuccessMessage", () => {
  it("shows linter trigger text when linter is enabled and scheduled", () => {
    expect(
      buildNormalizeSuccessMessage({
        resultSummary: "已插入 H1。",
        runLinterAfterNormalize: true,
        lintScheduled: true,
        lintDelayMs: 500
      })
    ).toContain("已触发 Linter");
  });

  it("shows no-linter text when linter is disabled", () => {
    expect(
      buildNormalizeSuccessMessage({
        resultSummary: "已插入 H1。",
        runLinterAfterNormalize: false,
        lintScheduled: false,
        lintDelayMs: 500
      })
    ).toBe("已插入 H1。 未执行 Linter。");
  });

  it("falls back to the normalization summary when linter is enabled but not scheduled", () => {
    expect(
      buildNormalizeSuccessMessage({
        resultSummary: "已插入 H1。",
        runLinterAfterNormalize: true,
        lintScheduled: false,
        lintDelayMs: 500
      })
    ).toBe("已插入 H1。");
  });
});
