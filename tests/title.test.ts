import { describe, expect, it } from "vitest";
import { buildRenamedFilePath, sanitizeFilenameBasename } from "../title";

describe("sanitizeFilenameBasename", () => {
  it("removes trailing punctuation from the basename", () => {
    expect(sanitizeFilenameBasename("测试标题。")).toBe("测试标题");
    expect(sanitizeFilenameBasename("测试标题!!!")).toBe("测试标题");
    expect(sanitizeFilenameBasename("测试标题；")).toBe("测试标题");
  });

  it("keeps internal punctuation unchanged", () => {
    expect(sanitizeFilenameBasename("Claude Dispatch：适合小白用户")).toBe(
      "Claude Dispatch：适合小白用户"
    );
  });
});

describe("buildRenamedFilePath", () => {
  it("builds the renamed path for the current markdown file", () => {
    expect(
      buildRenamedFilePath(
        "1-输入/01-待整理/测试标题。.md",
        "测试标题。",
        "测试标题",
        "md"
      )
    ).toBe("1-输入/01-待整理/测试标题.md");
  });
});
