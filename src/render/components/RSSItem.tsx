import * as React from "react";

import StarIcon from "./icons/StarIcon.js";
import DownloadIcon from "./icons/DownloadIcon.js";

import {
	addFavorite,
	addRead,
	addSaved,
	removeFavorite,
	removeSaved,
} from "../../util/feedle-note-utils.js";

import useObsidianApp from "../hooks/useObsidianApp.js";
import { App } from "obsidian";
import { FeedEntry } from "@extractus/feed-extractor";
import { WebviewModal } from "../../ui/WebviewModal.js";

const feedDateFormat = new Intl.DateTimeFormat("en-US", {
	dateStyle: "short",
	// timeStyle: "long",
	// timeZone: "",
});

export type RSSItem = FeedEntry;

type RSSItemProps = {
	item: FeedEntry;
	isFavorite: boolean;
	isSaved: boolean;
	isRead: boolean;
	onFavoriteChange?: (item: RSSItem) => void;
	onSaveChange?: (item: RSSItem) => void;
	onReadChange?: (item: RSSItem) => void;
};

export default function RSSListItem(props: RSSItemProps) {
	let app = useObsidianApp() as App;

	return (
		<li className="flex gap-1 items-center">
			<button title="Favorite Article" className="w-8" onClick={() => handleFavoriteButton(props.item)}>
				<StarIcon fillColor={props.isFavorite ? "currentColor" : "unset"} />
			</button>{" "}
			<button title="Save Article in Obsidian" className="w-8" onClick={() => handleSaveButton(props.item)}>
				<DownloadIcon fillColor={props.isSaved ? "currentColor" : "unset"} />
			</button>{" "}
			<a
				href={props.item.link}
				title={props.item.title}
				className={`truncate flex-1${props.isRead ? " opacity-50 line-through" : ""}`}
				onClick={(e) => { e.preventDefault(); handleReadClick(props.item); }}
			>
				{props.item.title}
			</a>
			<span className="whitespace-nowrap">
				{feedDateFormat.format(new Date(props.item.published || "")).toString()}
			</span>
		</li>
	);

	async function handleSaveButton(item: RSSItem) {
		if (!!props.isSaved) {
			// TODO: Handle removing saved note?
			await handleRemoveSaved(item);
		} else {
			// TODO: Handle adding saved note
			// node-unfluff
			await handleAddSaved(item);
		}

		props.onSaveChange && props.onSaveChange(item);
	}

	async function handleAddSaved(item: RSSItem) {
		if (app && app.workspace.activeEditor?.editor) {
			await addSaved(app, app.workspace.activeEditor.editor, item);
		}
	}

	async function handleRemoveSaved(item: RSSItem) {
		if (app && app.workspace.activeEditor?.editor) {
			await removeSaved(app.workspace.activeEditor.editor, item);
		}
	}

	function handleFavoriteButton(item: RSSItem) {
		if (props.isFavorite) {
			handleRemoveFavorite(item);
		} else {
			handleAddFavorite(item);
		}

		props.onFavoriteChange && props.onFavoriteChange(item);
	}

	function handleReadClick(item: RSSItem) {
		if (item.link) {
			new WebviewModal(app, item.link).open();
		}
		if (!props.isRead) {
			if (app && app.workspace.activeEditor?.editor) {
				addRead(app.workspace.activeEditor.editor, item);
			}
			props.onReadChange && props.onReadChange(item);
		}
	}

	function handleAddFavorite(item: RSSItem) {
		if (app && app.workspace.activeEditor?.editor) {
			addFavorite(app.workspace.activeEditor.editor, item);
		}
	}

	function handleRemoveFavorite(item: RSSItem) {
		if (app && app.workspace.activeEditor?.editor) {
			removeFavorite(app.workspace.activeEditor.editor, item);
		}
	}
}
