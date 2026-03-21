# Filename H1 Bootstrap

An Obsidian plugin that normalizes the current note so the filename becomes the top-level H1 heading.

This plugin is designed for note libraries where the filename is the source of truth for the note title, and where imported or copied content often arrives with unstable heading structure.

## What It Does

When you run `Normalize current note title heading`, the plugin will:

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

If the note is changed, the plugin can also trigger `Obsidian Linter` for the current file after a configurable delay.

## Settings

### Linter delay

Controls how many milliseconds to wait before triggering:

`Obsidian Linter: lint current file`

Default:

`500`

## Installation

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
