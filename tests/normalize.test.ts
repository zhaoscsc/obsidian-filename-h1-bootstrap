import { describe, expect, it } from "vitest";
import { normalizeMarkdownTitleHeading } from "../normalize";

describe("normalizeMarkdownTitleHeading", () => {
  it("demotes existing H1 headings and inserts filename H1", () => {
    const input = `---
tags: [科技]
---

罐体内储存的灭火剂是干粉。

# 用途

1. 可扑灭一般火灾。

# 使用方法

1. 摇晃瓶身。`;

    const result = normalizeMarkdownTitleHeading(input, "干粉灭火器");

    expect(result.changed).toBe(true);
    expect(result.content).toContain("# 干粉灭火器");
    expect(result.content).toContain("## 用途");
    expect(result.content).toContain("## 使用方法");
    expect(result.content).not.toContain("\n# 用途");
  });

  it("keeps existing H2/H3 levels when there is no H1", () => {
    const input = `前言内容

## 用途

### 细节`;

    const result = normalizeMarkdownTitleHeading(input, "干粉灭火器");

    expect(result.changed).toBe(true);
    expect(result.content).toBe(
      `# 干粉灭火器

前言内容

## 用途

### 细节`
    );
  });

  it("does nothing when the top H1 already matches and there is no later H1", () => {
    const input = `# 干粉灭火器

正文。

## 用途`;

    const result = normalizeMarkdownTitleHeading(input, "干粉灭火器");

    expect(result.changed).toBe(false);
    expect(result.summary).toContain("无需修改");
  });

  it("adds a blank line when the top H1 already matches but body starts immediately", () => {
    const input = `# 干粉灭火器
正文。

## 用途`;

    const result = normalizeMarkdownTitleHeading(input, "干粉灭火器");

    expect(result.changed).toBe(true);
    expect(result.content).toBe(
      `# 干粉灭火器

正文。

## 用途`
    );
    expect(result.summary).toContain("空行");
  });

  it("demotes later headings when the top H1 already matches but later H1 exists", () => {
    const input = `# 干粉灭火器

正文。

# 用途

## 细节`;

    const result = normalizeMarkdownTitleHeading(input, "干粉灭火器");

    expect(result.changed).toBe(true);
    expect(result.content).toContain("# 干粉灭火器");
    expect(result.content).toContain("## 用途");
    expect(result.content).toContain("### 细节");
  });

  it("ignores ATX-like lines inside fenced code blocks", () => {
    const input = `说明

\`\`\`
# not-a-heading
\`\`\`

## 正文`;

    const result = normalizeMarkdownTitleHeading(input, "测试文件");

    expect(result.changed).toBe(true);
    expect(result.content).toContain("# 测试文件");
    expect(result.content).toContain("# not-a-heading");
    expect(result.content).toContain("## 正文");
  });

  it("caps heading demotion at H6", () => {
    const input = `# 旧标题

###### 最深标题`;

    const result = normalizeMarkdownTitleHeading(input, "新标题");

    expect(result.changed).toBe(true);
    expect(result.content).toContain("# 新标题");
    expect(result.content).toContain("###### 最深标题");
  });
});
