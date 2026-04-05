import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

import { getFeedleNoteConfig } from "./util/feedle-note-utils.js";
import { FeedCache } from "./util/FeedCache.js";
import { Root, createRoot } from "react-dom/client";
import { StrictMode, createContext } from "react";
import * as React from "react";
import { FeedleApp } from "./render/FeedleApp.js";
import { AggFeedApp } from "./render/AggFeedApp.js";

export interface FeedConfig {
	url: string;
	tags: string[];
}

export interface FeedleSettings {
	cacheDurationMinutes: number;
	feeds: FeedConfig[];
}

const DEFAULT_SETTINGS: FeedleSettings = {
	cacheDurationMinutes: 15,
	feeds: [],
};

export const ObsidianAppContext = createContext<App | undefined>(undefined);
export const FeedCacheContext = createContext<FeedCache | undefined>(undefined);
export const FeedleSettingsContext = createContext<FeedleSettings>(DEFAULT_SETTINGS);

export default class FeedlePlugin extends Plugin {
	settings: FeedleSettings = DEFAULT_SETTINGS;
	feedCache: FeedCache = new FeedCache();
	roots: Set<Root> = new Set();

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new FeedleSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor("feedle", async (src, el, ctx) => {
			let feedleConfig = getFeedleNoteConfig(`\`\`\`feedle\n${src}\n\`\`\``);
			if (!feedleConfig) return;

			const props = feedleConfig.properities;
			const type = props["type"]?.trim();
			const root = createRoot(el);
			this.roots.add(root);

			const wrap = (children: React.ReactNode) => (
				<StrictMode>
					<ObsidianAppContext.Provider value={this.app}>
						<FeedCacheContext.Provider value={this.feedCache}>
							<FeedleSettingsContext.Provider value={this.settings}>
								{children}
							</FeedleSettingsContext.Provider>
						</FeedCacheContext.Provider>
					</ObsidianAppContext.Provider>
				</StrictMode>
			);

			if (type === "agg-feed") {
				const tags = (props["tags"] ?? "")
					.split(",")
					.map((t) => t.trim())
					.filter(Boolean);
				root.render(wrap(<AggFeedApp tags={tags} />));
			} else if (props["url"]) {
				root.render(wrap(<FeedleApp config={feedleConfig} />));
			}
		});
	}

	onunload() {
		this.roots.forEach((root) => root.unmount());
		this.roots.clear();
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
							this.plugin.settings = { ...this.plugin.settings, cacheDurationMinutes: parsed };
							await this.plugin.saveSettings();
						}
					})
			);

		containerEl.createEl("h3", { text: "Feed Registry" });
		containerEl.createEl("p", {
			text: "Register feeds with tags so they can be aggregated using type: agg-feed blocks.",
			cls: "setting-item-description",
		});

		const renderFeeds = () => {
			feedListEl.empty();
			this.plugin.settings.feeds.forEach((feed, index) => {
				new Setting(feedListEl)
					.setName(feed.url)
					.setDesc("Tags: " + (feed.tags.join(", ") || "(none)"))
					.addButton((btn) =>
						btn
							.setButtonText("Remove")
							.setWarning()
							.onClick(async () => {
								this.plugin.settings = {
									...this.plugin.settings,
									feeds: this.plugin.settings.feeds.filter((_, i) => i !== index),
								};
								await this.plugin.saveSettings();
								renderFeeds();
							})
					);
			});
		};

		const feedListEl = containerEl.createDiv();
		renderFeeds();

		// Add new feed
		let newUrl = "";
		let newTags = "";

		new Setting(containerEl)
			.setName("Add feed")
			.setDesc("Enter a feed URL and comma-separated tags, then click Add.")
			.addText((text) =>
				text
					.setPlaceholder("https://example.com/feed.xml")
					.onChange((value) => { newUrl = value.trim(); })
			)
			.addText((text) =>
				text
					.setPlaceholder("tags: ai, news")
					.onChange((value) => { newTags = value; })
			)
			.addButton((btn) =>
				btn.setButtonText("Add").onClick(async () => {
					if (!newUrl) return;
					const tags = newTags
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean);
					this.plugin.settings = {
						...this.plugin.settings,
						feeds: [...this.plugin.settings.feeds, { url: newUrl, tags }],
					};
					await this.plugin.saveSettings();
					renderFeeds();
				})
			);
	}
}
