import * as React from "react";
import { useState, useEffect, useContext } from "react";
import useObsidianApp from "./hooks/useObsidianApp.js";
import "./global.css";

import RSSListItem, { RSSItem } from "./components/RSSItem.js";

import {
	getFavoritesFromNote,
	getFeedleNoteConfig,
	getSavedFromNote,
	getReadFromNote,
	santizeFileName,
} from "../util/feedle-note-utils.js";
import { FeedData, FeedEntry } from "@extractus/feed-extractor";
import { FeedCacheContext, FeedleSettingsContext } from "../main.js";

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

			const cacheDurationMs = (settings as any).cacheDurationMinutes * 60 * 1000;
			(feedCache as any)
				.get(config.properities["url"], cacheDurationMs)
				.then((data: any) => setRSSData(data))
				.catch((err: any) => console.error("[feedle] feed fetch failed:", err));
		}
	}, [config, feedCache, settings]);

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
