# Feed Caching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a session-scoped, URL-keyed feed cache so re-opening a note or aggregating feeds avoids redundant network requests.

**Architecture:** A `FeedCache` class lives on the plugin instance, keyed by URL with a timestamp. `FeedleApp` reads the cache via React context instead of calling `requestUrl` directly. Cache duration is user-configurable in plugin settings (default 15 min).

**Tech Stack:** TypeScript, React context, Obsidian Plugin API (`requestUrl`, `PluginSettingTab`, `Setting`), `@extractus/feed-extractor`

---

### Task 1: Create `FeedCache` class

**Files:**
- Create: `src/util/FeedCache.ts`

- [ ] **Step 1: Create the file with the FeedCache class**

```ts
import { requestUrl } from "obsidian";
import { FeedData, extractFromXml } from "@extractus/feed-extractor";

interface CacheEntry {
	data: FeedData;
	fetchedAt: number;
}

export class FeedCache {
	private cache: Map<string, CacheEntry> = new Map();

	async get(url: string, cacheDurationMs: number): Promise<FeedData> {
		const entry = this.cache.get(url);
		if (entry && Date.now() - entry.fetchedAt < cacheDurationMs) {
			return entry.data;
		}

		const res = await requestUrl({
			url,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36",
			},
		});

		const data = extractFromXml(res.text);
		data.entries = data.entries?.sort(
			(a, b) =>
				(new Date(b.published || "") as any) -
				(new Date(a.published || "") as any)
		);

		this.cache.set(url, { data, fetchedAt: Date.now() });
		return data;
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add src/util/FeedCache.ts
git commit -m "feat: add FeedCache class with TTL-based URL cache"
```

---

### Task 2: Update settings and wire up plugin

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Replace the stub settings interface and add FeedCache + context**

Replace the entire contents of `src/main.tsx` with:

```tsx
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
```

- [ ] **Step 2: Verify the build compiles**

```bash
cd "/home/alexmason/Documents/2026 Vault/.obsidian/plugins/feedle" && npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat: add cacheDurationMinutes setting, FeedCache context, register settings tab"
```

---

### Task 3: Update FeedleApp to use FeedCache

**Files:**
- Modify: `src/render/FeedleApp.tsx`

- [ ] **Step 1: Replace the inline fetch block with feedCache.get()**

In `src/render/FeedleApp.tsx`, add the context imports at the top and replace the `useEffect` fetch logic.

Replace the import block and component to read:

```tsx
import * as React from "react";
import { useState, useEffect, useContext } from "react";
import useObsidianApp from "./hooks/useObsidianApp";
import "./global.css";

import RSSListItem, { RSSItem } from "./components/RSSItem";

import {
	getFavoritesFromNote,
	getFeedleNoteConfig,
	getSavedFromNote,
	getReadFromNote,
	santizeFileName,
} from "../util/feedle-note-utils";
import { FeedData, FeedEntry } from "@extractus/feed-extractor";
import { FeedCacheContext, FeedleSettingsContext } from "../main";

type FeedleAppProps = {
	config: {
		url?: string;
	} & ReturnType<typeof getFeedleNoteConfig>;
};

const PAGE_SIZE = 10;

export function FeedleApp({ config }: FeedleAppProps) {
	let app = useObsidianApp();
	let feedCache = useContext(FeedCacheContext);
	let settings = useContext(FeedleSettingsContext);

	let [rssData, setRSSData] = useState<FeedData>();
	let [favoriteContent, setFavoriteContent] = useState<string>("");
	let [savedContent, setSavedContent] = useState<string>("");
	let [readContent, setReadContent] = useState<string>("");
	let [page, setPage] = useState(0);

	useEffect(() => {
		if (!config) return;
		if (!app || !app.workspace.activeEditor?.editor) return;
		if (!feedCache) return;
		if (config.properities["url"]) {
			setFavoriteContent(
				getFavoritesFromNote(app.workspace.activeEditor.editor.getValue())
			);
			setSavedContent(
				getSavedFromNote(app.workspace.activeEditor.editor.getValue())
			);
			setReadContent(
				getReadFromNote(app.workspace.activeEditor.editor.getValue())
			);

			const cacheDurationMs = settings.cacheDurationMinutes * 60 * 1000;
			feedCache
				.get(config.properities["url"], cacheDurationMs)
				.then((data) => setRSSData(data));
		}
	}, [config]);

	if (!app) return <>Could not load feedle.</>;
	if (!rssData || !rssData.entries) return <>Could not load feed data.</>;

	return (
		<>
			<div className="flex justify-between items-center px-8">
				<button
					className="py-1 px-1"
					disabled={page === 0}
					onClick={onPrevPage}
				>
					Previous Page
				</button>
				<p>
					Page {page + 1}/{Math.ceil(rssData.entries.length / 10)}
				</p>
				<button
					className="py-1 px-1"
					disabled={page >= Math.ceil(rssData.entries.length / 10) - 1}
					onClick={onNextPage}
				>
					Next Page
				</button>
			</div>
			<ol className="pr-8">
				{rssData.entries
					.slice(page * PAGE_SIZE, page * PAGE_SIZE + 10)
					.map((item: FeedEntry) => {
						return (
							<RSSListItem
								key={JSON.stringify(item)}
								item={item}
								isFavorite={favoriteContent.includes(item.link!)}
								isSaved={savedContent.includes(santizeFileName(item.title!))}
								isRead={readContent.includes(item.link!)}
								onFavoriteChange={handleFavoriteChange}
								onSaveChange={handleSavedChange}
								onReadChange={handleReadChange}
							/>
						);
					})}
			</ol>
		</>
	);

	function onNextPage() {
		setPage(page + 1);
	}
	function onPrevPage() {
		setPage(page - 1);
	}

	function handleFavoriteChange() {
		if (app && app.workspace.activeEditor?.editor) {
			setFavoriteContent(
				getFavoritesFromNote(app.workspace.activeEditor.editor.getValue())
			);
		}
	}

	function handleSavedChange() {
		if (app && app.workspace.activeEditor?.editor) {
			setSavedContent(
				getSavedFromNote(app.workspace.activeEditor.editor.getValue())
			);
		}
	}

	function handleReadChange() {
		if (app && app.workspace.activeEditor?.editor) {
			setReadContent(
				getReadFromNote(app.workspace.activeEditor.editor.getValue())
			);
		}
	}
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
cd "/home/alexmason/Documents/2026 Vault/.obsidian/plugins/feedle" && npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 3: Manual smoke test**

1. Open a note with a `feedle` code block — confirm the feed loads
2. Close and reopen the note within 15 min — confirm no network request fires (Obsidian DevTools → Network tab)
3. Open Obsidian Settings → Feedle — confirm "Feed cache duration (minutes)" field appears with value `15`
4. Change to `1`, wait 1 min, reopen the note — confirm a fresh fetch occurs

- [ ] **Step 4: Commit**

```bash
git add src/render/FeedleApp.tsx
git commit -m "feat: use FeedCache in FeedleApp instead of inline requestUrl"
```
