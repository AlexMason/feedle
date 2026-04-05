import * as React from "react";
import { useState, useEffect, useContext } from "react";
import useObsidianApp from "./hooks/useObsidianApp";
import "./global.css";
import RSSListItem, { RSSItem } from "./components/RSSItem";
import {
	getFavoritesFromNote,
	getSavedFromNote,
	getReadFromNote,
	santizeFileName,
} from "../util/feedle-note-utils";
import { FeedEntry } from "@extractus/feed-extractor";
import { FeedCacheContext, FeedleSettingsContext } from "../main";

type AggFeedAppProps = {
	tags: string[];
};

/** Represents a parsed feedle block from a vault note */
type FeedleFeed = {
	url: string;
	tags: string[];
};

const PAGE_SIZE = 10;

/**
 * Parses a single feedle block's raw text content into a FeedleFeed.
 * Returns null if the block is missing a url or is an agg-feed type.
 *
 * @param blockContent - Raw text inside the ```feedle fence (no backticks)
 */
function parseFeedleBlock(blockContent: string): FeedleFeed | null {
	const lines = blockContent.trim().split("\n");
	const fields: Record<string, string> = {};

	for (const line of lines) {
		const colonIdx = line.indexOf(":");
		if (colonIdx === -1) continue;
		const key = line.slice(0, colonIdx).trim();
		const value = line.slice(colonIdx + 1).trim();
		fields[key] = value;
	}

	// Exclude agg-feed blocks — they have no url and are aggregator views
	if (fields["type"] === "agg-feed") return null;
	if (!fields["url"]) return null;

	const tags = fields["tags"]
		? fields["tags"].split(",").map((t) => t.trim()).filter(Boolean)
		: [];

	return { url: fields["url"], tags };
}

/**
 * Scrapes all markdown files in the vault for feedle blocks,
 * parses them, and returns non-agg-feed feeds.
 *
 * @param app - The Obsidian App instance
 */
async function scrapeFeedsFromVault(app: any): Promise<FeedleFeed[]> {
	const files = app.vault.getMarkdownFiles();
	const feeds: FeedleFeed[] = [];

	// Regex captures everything inside ```feedle ... ``` fences
	const feedleBlockRegex = /```feedle\n([\s\S]*?)```/g;

	for (const file of files) {
		const content = await app.vault.cachedRead(file);
		let match: RegExpExecArray | null;

		while ((match = feedleBlockRegex.exec(content)) !== null) {
			const parsed = parseFeedleBlock(match[1]);
			if (parsed) {
				feeds.push(parsed);
				console.log(`[feedle] Found feed: ${parsed.url} in ${file.path}`);
			}
		}

		// Reset lastIndex between files since we reuse the regex
		feedleBlockRegex.lastIndex = 0;
	}

	console.log(`[feedle] Total feeds scraped from vault: ${feeds.length}`);
	return feeds;
}

export function AggFeedApp({ tags }: AggFeedAppProps) {
	let app = useObsidianApp();
	let feedCache = useContext(FeedCacheContext);
	let settings = useContext(FeedleSettingsContext);
	let [entries, setEntries] = useState<FeedEntry[]>([]);
	let [loading, setLoading] = useState(true);
	let [favoriteContent, setFavoriteContent] = useState("");
	let [savedContent, setSavedContent] = useState("");
	let [readContent, setReadContent] = useState("");
	let [page, setPage] = useState(0);

	useEffect(() => {
		if (!app || !feedCache) return;

		setLoading(true);

		scrapeFeedsFromVault(app).then((allFeeds) => {
			const matchingFeeds = allFeeds.filter((f) =>
				tags.some((tag) => f.tags.includes(tag))
			);

			console.log(`[feedle] Feeds matching tags [${tags.join(", ")}]:`, matchingFeeds);

			if (matchingFeeds.length === 0) {
				setEntries([]);
				setLoading(false);
				return;
			}

			if (app.workspace.activeEditor?.editor) {
				const noteText = app.workspace.activeEditor.editor.getValue();
				setFavoriteContent(getFavoritesFromNote(noteText));
				setSavedContent(getSavedFromNote(noteText));
				setReadContent(getReadFromNote(noteText));
			}

			const cacheDurationMs = settings.cacheDurationMinutes * 60 * 1000;

			Promise.allSettled(
				matchingFeeds.map((f) => feedCache!.get(f.url, cacheDurationMs))
			).then((results) => {
				const merged: FeedEntry[] = [];

				for (const result of results) {
					if (result.status === "fulfilled" && result.value.entries) {
						merged.push(...result.value.entries);
					}
				}

				merged.sort((a, b) => {
					const aTime = a.published ? new Date(a.published).getTime() : 0;
					const bTime = b.published ? new Date(b.published).getTime() : 0;
					return bTime - aTime;
				});

				setEntries(merged);
				setLoading(false);
			});
		});
	}, [tags, feedCache, settings]);

	if (!app) return <>Could not load feedle.</>;
	if (loading) return <>Loading feeds...</>;
	if (entries.length === 0)
		return <>No feeds found matching tags: {tags.join(", ")}</>;

	const totalPages = Math.ceil(entries.length / PAGE_SIZE);

	return (
		<>
			<div className="flex justify-between items-center px-8">
				<button
					className="py-1 px-1"
					disabled={page === 0}
					onClick={() => setPage(page - 1)}
				>
					Previous Page
				</button>
				<p>Page {page + 1}/{totalPages}</p>
				<button
					className="py-1 px-1"
					disabled={page >= totalPages - 1}
					onClick={() => setPage(page + 1)}
				>
					Next Page
				</button>
			</div>
			<ol className="pr-8">
				{entries
					.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
					.map((item: FeedEntry) => (
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
					))}
			</ol>
		</>
	);

	function handleFavoriteChange() {
		if (app?.workspace.activeEditor?.editor) {
			setFavoriteContent(
				getFavoritesFromNote(app.workspace.activeEditor.editor.getValue())
			);
		}
	}

	function handleSavedChange() {
		if (app?.workspace.activeEditor?.editor) {
			setSavedContent(
				getSavedFromNote(app.workspace.activeEditor.editor.getValue())
			);
		}
	}

	function handleReadChange() {
		if (app?.workspace.activeEditor?.editor) {
			setReadContent(
				getReadFromNote(app.workspace.activeEditor.editor.getValue())
			);
		}
	}
}