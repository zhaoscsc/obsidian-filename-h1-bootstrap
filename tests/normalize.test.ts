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

  it("normalizes a top equivalent H1 after filename punctuation cleanup without creating a duplicate title", () => {
    const input = `# Tw93分享我的方法，想获得任何网页纯Markdown。

## 正文

Tw93分享我的方法，想获得任何网页纯Markdown。`;

    const result = normalizeMarkdownTitleHeading(
      input,
      "Tw93分享我的方法，想获得任何网页纯Markdown"
    );

    expect(result.changed).toBe(true);
    expect(result.content).toBe(
      `# Tw93分享我的方法，想获得任何网页纯Markdown

## 正文

Tw93分享我的方法，想获得任何网页纯Markdown。`
    );
    expect(result.content).not.toContain("## Tw93分享我的方法，想获得任何网页纯Markdown。");
    expect(result.summary).toContain("规范为");
  });

  it("promotes a top matching H2 to H1 without inserting a duplicate title", () => {
    const input = `## 澄迈县

## 0\\. 基础信息

正文。`;

    const result = normalizeMarkdownTitleHeading(input, "澄迈县");

    expect(result.changed).toBe(true);
    expect(result.content).toBe(
      `# 澄迈县

## 0\\. 基础信息

正文。`
    );
    expect(result.content).not.toContain("## 澄迈县");
    expect(result.summary).toContain("提升为 H1");
  });

  it("promotes a top equivalent H2 after filename punctuation cleanup without creating a duplicate title", () => {
    const input = `## Tw93分享我的方法，想获得任何网页纯Markdown。

## 正文

内容。`;

    const result = normalizeMarkdownTitleHeading(
      input,
      "Tw93分享我的方法，想获得任何网页纯Markdown"
    );

    expect(result.changed).toBe(true);
    expect(result.content).toBe(
      `# Tw93分享我的方法，想获得任何网页纯Markdown

## 正文

内容。`
    );
    expect(result.content).not.toContain("## Tw93分享我的方法，想获得任何网页纯Markdown。");
    expect(result.summary).toContain("提升为 H1");
  });

  it("promotes a top matching H2 to H1 and adds a blank line before body content", () => {
    const input = `## 澄迈县
正文。

## 0\\. 基础信息`;

    const result = normalizeMarkdownTitleHeading(input, "澄迈县");

    expect(result.changed).toBe(true);
    expect(result.content).toBe(
      `# 澄迈县

正文。

## 0\\. 基础信息`
    );
    expect(result.summary).toContain("空行");
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

  it("does not demote later headings when the top H1 already matches", () => {
    const input = `# 干粉灭火器

正文。

# 用途

## 细节`;

    const result = normalizeMarkdownTitleHeading(input, "干粉灭火器");

    expect(result.changed).toBe(false);
    expect(result.content).toBe(input);
    expect(result.summary).toContain("无需修改");
  });

  it("is idempotent when run multiple times after normalization", () => {
    const input = `# Claude Dispatch 特别适合小白用户。可以通过手机 Claude App 远程执行任务

## Claude Dispatch 特别适合小白用户。可以通过手机 Claude App 远程执行任务

### Claude Dispatch 特别适合小白用户。可以通过手机 Claude App 远程执行任务`;

    const firstRun = normalizeMarkdownTitleHeading(
      input,
      "Claude Dispatch 特别适合小白用户。可以通过手机 Claude App 远程执行任务"
    );
    const secondRun = normalizeMarkdownTitleHeading(
      firstRun.content,
      "Claude Dispatch 特别适合小白用户。可以通过手机 Claude App 远程执行任务"
    );

    expect(firstRun.changed).toBe(false);
    expect(secondRun.changed).toBe(false);
    expect(secondRun.content).toBe(firstRun.content);
  });

  it("is idempotent after promoting a top matching H2 to H1", () => {
    const input = `## 澄迈县

## 0\\. 基础信息

正文。`;

    const firstRun = normalizeMarkdownTitleHeading(input, "澄迈县");
    const secondRun = normalizeMarkdownTitleHeading(firstRun.content, "澄迈县");

    expect(firstRun.changed).toBe(true);
    expect(secondRun.changed).toBe(false);
    expect(secondRun.content).toBe(firstRun.content);
  });

  it("is idempotent after normalizing a top equivalent H1", () => {
    const input = `# Tw93分享我的方法，想获得任何网页纯Markdown。

## 正文

内容。`;

    const firstRun = normalizeMarkdownTitleHeading(
      input,
      "Tw93分享我的方法，想获得任何网页纯Markdown"
    );
    const secondRun = normalizeMarkdownTitleHeading(
      firstRun.content,
      "Tw93分享我的方法，想获得任何网页纯Markdown"
    );

    expect(firstRun.changed).toBe(true);
    expect(secondRun.changed).toBe(false);
    expect(secondRun.content).toBe(firstRun.content);
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
