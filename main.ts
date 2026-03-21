import { MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import { CURRENT_FILE_LINTER_DELAY_MS, scheduleCurrentFileLint } from "./linter";
import { normalizeMarkdownTitleHeading } from "./normalize";
import {
  DEFAULT_SETTINGS,
  FilenameH1BootstrapSettings,
  buildNormalizeSuccessMessage,
  normalizePluginSettings
} from "./settings";

export default class FilenameH1BootstrapPlugin extends Plugin {
  settings: FilenameH1BootstrapSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addCommand({
      id: "normalize-current-note-title-heading",
      name: "Normalize current note title heading",
      callback: async () => {
        await this.normalizeCurrentNote();
      }
    });

    this.addSettingTab(new FilenameH1BootstrapSettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    const savedData = await this.loadData();
    this.settings = normalizePluginSettings(savedData);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async normalizeCurrentNote(): Promise<void> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const file = view?.file;

    if (!view || !file || file.extension !== "md") {
      new Notice("当前没有可处理的 Markdown 笔记。");
      return;
    }

    try {
      await view.save();
    } catch (error) {
      new Notice("当前笔记保存失败，已跳过处理。");
      console.error("[obsidian-filename-h1-bootstrap] Failed to save current note.", error);
      return;
    }

    const originalContent = await this.app.vault.read(file);
    const result = normalizeMarkdownTitleHeading(originalContent, file.basename);

    if (result.notice) {
      new Notice(result.notice);
      return;
    }

    if (!result.changed) {
      new Notice(result.summary);
      return;
    }

    await this.app.vault.modify(file, result.content);
    const lintScheduled = this.settings.runLinterAfterNormalize
      ? scheduleCurrentFileLint(
          file.path,
          {
            hasCommand: (commandId) => Boolean(this.app.commands?.commands?.[commandId]),
            getActiveFilePath: () => this.app.workspace.getActiveFile()?.path ?? null,
            executeCommandById: (commandId) =>
              this.app.commands.executeCommandById(commandId),
            notify: (message) => {
              new Notice(message);
            },
            logError: (message, error) => {
              console.error(message, error);
            }
          },
          this.settings.lintDelayMs
        )
      : false;

    const successMessage = buildNormalizeSuccessMessage({
      resultSummary: result.summary,
      runLinterAfterNormalize: this.settings.runLinterAfterNormalize,
      lintScheduled,
      lintDelayMs: this.settings.lintDelayMs
    });

    new Notice(successMessage);
  }
}

class FilenameH1BootstrapSettingTab extends PluginSettingTab {
  plugin: FilenameH1BootstrapPlugin;

  constructor(app: FilenameH1BootstrapSettingTab["app"], plugin: FilenameH1BootstrapPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("标题归一后自动执行 Linter")
      .setDesc("开启后，标题归一真的改动了当前笔记时，会自动执行“Linter：格式化当前文件”。")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.runLinterAfterNormalize)
          .onChange(async (value) => {
            this.plugin.settings.runLinterAfterNormalize = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Linter 延迟时间")
      .setDesc("仅在“标题归一后自动执行 Linter”开启时生效。")
      .addText((text) => {
        text
          .setPlaceholder(String(CURRENT_FILE_LINTER_DELAY_MS))
          .setValue(String(this.plugin.settings.lintDelayMs))
          .onChange(async (value) => {
            const parsedValue = Number(value.trim());
            this.plugin.settings = normalizePluginSettings({
              ...this.plugin.settings,
              lintDelayMs: parsedValue
            });
            await this.plugin.saveSettings();
            text.setValue(String(this.plugin.settings.lintDelayMs));
          });
      });
  }
}
