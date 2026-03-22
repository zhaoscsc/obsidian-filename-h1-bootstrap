# Filename H1 Bootstrap

An Obsidian plugin that normalizes the current note so the filename becomes the top-level H1 heading.

This plugin is designed for note libraries where the filename is the source of truth for the note title, and where imported or copied content often arrives with unstable heading structure.

[中文说明](#中文说明)

## What It Does

When you run `Normalize current note title heading`, the plugin will:

- trim trailing punctuation from the current filename before normalization when it ends with `.,;:!。，；：！`
- insert `# <filename>` at the top of the note when needed
- demote existing ATX H1 headings so the filename becomes the single top-level title
- preserve H2-H6 when there is no existing H1
- enforce a single blank line between the top H1 and the following body content
- ignore fenced code blocks
- skip likely Setext heading notes instead of making risky edits
- optionally trigger `Obsidian Linter` to format the current file after normalization

## Commands

### `Normalize current note title heading`

Runs normalization on the currently open Markdown file.

Depending on plugin settings, the plugin can also trigger `Obsidian Linter` for the current file after a configurable delay.

### Shortcut tip

You can assign a hotkey to `Normalize current note title heading` in:

`Settings -> Hotkeys`

If you want a faster one-key workflow, you can bind a shortcut you use often.

Example:

- `Command+S`

Note:

- `Command+S` may override the default save behavior in Obsidian, so use it only if that matches your workflow.
- If you want a safer choice, use something like `Command+Shift+S` or another custom combination.

## Settings

### Linter run mode

Controls when the plugin should automatically run `Obsidian Linter` for the current file.

Options:

- `Never`
- `Only when changed`
- `Always`

Default:

`Only when changed`

### Linter delay

Controls how many milliseconds to wait before triggering:

`Obsidian Linter: lint current file`

This setting only applies when the Linter run mode is not `Never`.

Default:

`500`

## Installation

### Install with BRAT

If you use [BRAT](https://github.com/TfTHacker/obsidian42-brat), you can install this plugin directly from GitHub:

1. Install and enable `BRAT` in Obsidian
2. Open `Settings -> BRAT`
3. Choose `Add Beta plugin`
4. Paste this repository URL:

`https://github.com/zhaoscsc/obsidian-filename-h1-bootstrap`

5. Confirm the installation
6. Enable `Filename H1 Bootstrap` in Community Plugins

### Manual installation

Copy these files into your vault:

`.obsidian/plugins/obsidian-filename-h1-bootstrap/`

Required files:

- `main.js`
- `manifest.json`
- `versions.json`

Optional source files are included in this repository for development.

Then:

1. Open Obsidian
2. Go to `Settings -> Community plugins`
3. Reload community plugins or restart Obsidian
4. Enable `Filename H1 Bootstrap`

## Development

```bash
npm install
npm test
npm run build
```

## Repository Layout

- `main.ts`: plugin entry point
- `normalize.ts`: heading normalization logic
- `linter.ts`: delayed Linter integration
- `tests/`: unit tests

## Notes

- This plugin currently focuses on ATX headings (`# Heading`)
- It does not batch-process the whole vault
- It does not rename files based on headings
- It is intentionally optimized for controlled, manual normalization

---

## 中文说明

`Filename H1 Bootstrap` 是一个 Obsidian 插件，用来把“当前笔记的文件名”整理成正文顶部的一级标题。

它适合这种笔记库：

- 文件名本身就是这篇笔记最准确的标题
- 很多笔记是从网页、讲义、资料库或其他系统复制进来的
- 正文标题层级经常不稳定，尤其是会出现错误的 H1

### 它能做什么

当你执行 `Normalize current note title heading` 时，插件会：

- 在需要时，把 `# 文件名` 插到正文最前面
- 如果文件名尾部是 `.,;:!。，；：！` 这些符号，会先自动清理掉再继续处理
- 如果正文已经有 ATX H1，就把这些 H1 整体降一级
- 如果正文没有 H1，只保留原有 H2-H6 层级不变
- 强制保证顶部 H1 和正文之间只有一个空行
- 跳过代码块里的 `#`
- 遇到疑似 Setext 标题时先跳过，避免高风险误改
- 在本次真的修改了笔记后，可选延迟触发一次 `Obsidian Linter`

### 命令

#### `Normalize current note title heading`

处理当前打开的 Markdown 笔记。

插件还可以按设置在一个可配置的延迟后，自动执行一次当前文件的 Linter。

#### 小技巧：给命令绑定快捷键

你可以在这里给这个命令绑定快捷键：

`设置 -> 快捷键`

如果你想把“标题归一”变成一个更快的动作，可以绑定一个自己顺手的组合键。

比如：

- `Command+S`

注意：

- `Command+S` 可能会覆盖 Obsidian 默认的保存行为，更适合已经明确想这么改的人。
- 如果你想更稳妥一些，可以改成 `Command+Shift+S` 或其他自定义组合键。

### 设置

#### Linter 执行模式

控制插件什么时候自动执行一次当前文件的 Linter。

可选值：

- `不执行`
- `仅修改时执行`
- `始终执行`

默认值：

`仅修改时执行`

#### Linter 延迟时间

控制标题归一后，等待多少毫秒再执行：

`Obsidian Linter: lint current file`

只有在 Linter 执行模式不是 `不执行` 时，这个设置才生效。

默认值：

`500`

### 安装方法

#### 借助 BRAT 安装

如果你已经在用 [BRAT](https://github.com/TfTHacker/obsidian42-brat)，可以直接从 GitHub 安装这个插件：

1. 在 Obsidian 里安装并启用 `BRAT`
2. 打开 `设置 -> BRAT`
3. 选择 `Add Beta plugin`
4. 粘贴这个仓库地址：

`https://github.com/zhaoscsc/obsidian-filename-h1-bootstrap`

5. 确认安装
6. 回到社区插件列表，启用 `Filename H1 Bootstrap`

#### 手动安装

把下面这些文件放进你的 Obsidian 库：

`.obsidian/plugins/obsidian-filename-h1-bootstrap/`

必须文件：

- `main.js`
- `manifest.json`
- `versions.json`

仓库里同时保留了源码文件，方便继续开发和修改。

然后：

1. 打开 Obsidian
2. 进入 `设置 -> 社区插件`
3. 重载社区插件，或者重启 Obsidian
4. 启用 `Filename H1 Bootstrap`

### 开发

```bash
npm install
npm test
npm run build
```

### 仓库结构

- `main.ts`：插件入口
- `normalize.ts`：标题归一逻辑
- `linter.ts`：延迟触发 Linter 的逻辑
- `tests/`：单元测试

### 说明

- 当前版本主要处理 ATX 标题（`# Heading`）
- 不会批量扫描整个 vault
- 不会根据正文标题反向重命名文件
- 设计目标是“手动、可控、稳定”的标题归一，而不是全自动改库
