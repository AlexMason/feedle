import {
	App,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

import { addFavorite, getFeedleNoteConfig } from "./util/feedle-note-utils";
import { Root, createRoot } from "react-dom/client";
import { StrictMode, createContext } from "react";
import * as React from "react";
import { FeedleApp } from "./render/FeedleApp";
// Remember to rename these classes and interfaces!

interface FeedleSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: FeedleSettings = {
	mySetting: "default",
};

export const ObsidianAppContext = createContext<App | undefined>(undefined);

export default class FeedlePlugin extends Plugin {
	settings: FeedleSettings;
	root: Root | null = null;

	async onload() {
		await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor("feedle", async (src, el, ctx) => {
			let feedleConfig = getFeedleNoteConfig(`\`\`\`feedle\n${src}\n\`\`\``);
			if (feedleConfig && feedleConfig.properities["url"]) {
				this.root = createRoot(el);
				this.root.render(
					<StrictMode>
						<ObsidianAppContext.Provider value={this.app}>
							<FeedleApp config={feedleConfig} />
						</ObsidianAppContext.Provider>
					</StrictMode>
				);
			}
		});
	}

	onunload() {
		this.root?.unmount();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: FeedlePlugin;

	constructor(app: App, plugin: FeedlePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
