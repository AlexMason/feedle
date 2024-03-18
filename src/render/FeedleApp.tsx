import * as React from "react";
import { useState, useEffect } from "react";
import useObsidianApp from "./hooks/useObsidianApp";
import "./global.css";

import RSSListItem, { RSSItem } from "./components/RSSItem";

import {
	getFavoritesFromNote,
	getFeedleNoteConfig,
	getSavedFromNote,
	santizeFileName,
} from "src/util/feedle-note-utils";
import { requestUrl } from "obsidian";
import { FeedData, FeedEntry, extractFromXml } from "@extractus/feed-extractor";

type FeedleAppProps = {
	config: {
		url?: string;
	} & ReturnType<typeof getFeedleNoteConfig>;
};

const PAGE_SIZE = 10;

export function FeedleApp({ config }: FeedleAppProps) {
	let app = useObsidianApp();

	let [rssData, setRSSData] = useState<FeedData>();
	let [favoriteContent, setFavoriteContent] = useState<string>("");
	let [savedContent, setSavedContent] = useState<string>("");
	let [page, setPage] = useState(0);

	useEffect(() => {
		if (!config) return;
		if (!app || !app.workspace.activeEditor?.editor) return;
		if (config.properities["url"]) {
			setFavoriteContent(
				getFavoritesFromNote(app.workspace.activeEditor.editor.getValue())
			);

			setSavedContent(
				getSavedFromNote(app.workspace.activeEditor.editor.getValue())
			);

			requestUrl({
				url: config.properities["url"],
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36",
				},
			}).then((res) => {
				let results = extractFromXml(res.text, {
					// getExtraEntryFields: (feedEntry: any) => {
					// 	const {} = feedEntry;
					// 	return {
					// 		youtubeVideoUrl: ''
					// 	};
					// },
				});
				console.log("extractFromXml(res.text)", results);

				results.entries = results.entries?.sort((a, b) => {
					return (
						(new Date(b.published || "") as any) -
						(new Date(a.published || "") as any)
					);
				});

				setRSSData(results);
			});
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
			<ol>
				{rssData.entries
					.slice(page * PAGE_SIZE, page * PAGE_SIZE + 10)
					.map((item: FeedEntry) => {
						return (
							<RSSListItem
								key={JSON.stringify(item)}
								item={item}
								isFavorite={favoriteContent.includes(item.link!)}
								isSaved={savedContent.includes(santizeFileName(item.title!))}
								onFavoriteChange={handleFavoriteChange}
								onSaveChange={handleSavedChange}
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
}
