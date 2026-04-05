import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

import { getFeedleNoteConfig } from "./util/feedle-note-utils";
import { FeedCache } from "./util/FeedCache";
import { Root, createRoot } from "react-dom/client";
import { StrictMode, createContext } from "react";
import * as React from "react";
import { FeedleApp } from "./render/FeedleApp";

interface FeedleSettings {
	cacheDurationMinutes: number;
}

const DEFAULT_SETTINGS: FeedleSettings = {
	cacheDurationMinutes: 15,
};

export const ObsidianAppContext = createContext<App | undefined>(undefined);
export const FeedCacheContext = createContext<FeedCache | undefined>(undefined);
export const FeedleSettingsContext = createContext<FeedleSettings>(DEFAULT_SETTINGS);

export default class FeedlePlugin extends Plugin {
	settings: FeedleSettings = DEFAULT_SETTINGS;
	feedCache: FeedCache = new FeedCache();
	root: Root | null = null;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new FeedleSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor("feedle", async (src, el, ctx) => {
			let feedleConfig = getFeedleNoteConfig(`\`\`\`feedle\n${src}\n\`\`\``);
			if (feedleConfig && feedleConfig.properities["url"]) {
				this.root = createRoot(el);
				this.root.render(
					<StrictMode>
						<ObsidianAppContext.Provider value={this.app}>
							<FeedCacheContext.Provider value={this.feedCache}>
								<FeedleSettingsContext.Provider value={this.settings}>
									<FeedleApp config={feedleConfig} />
								</FeedleSettingsContext.Provider>
							</FeedCacheContext.Provider>
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

class FeedleSettingTab extends PluginSettingTab {
	plugin: FeedlePlugin;

	constructor(app: App, plugin: FeedlePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Feed cache duration (minutes)")
			.setDesc("How long to cache feed data before refetching. Default: 15 minutes.")
			.addText((text) =>
				text
					.setPlaceholder("15")
					.setValue(String(this.plugin.settings.cacheDurationMinutes))
					.onChange(async (value) => {
						const parsed = parseInt(value, 10);
						if (!isNaN(parsed) && parsed > 0) {
							this.plugin.settings.cacheDurationMinutes = parsed;
							await this.plugin.saveSettings();
						}
					})
			);
	}
}
