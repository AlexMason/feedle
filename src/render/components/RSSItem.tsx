import * as React from "react";

import StarIcon from "./icons/StarIcon";
import BookmarkIcon from "./icons/BookmarkIcon";

import {
	addFavorite,
	addSaved,
	removeFavorite,
	removeSaved,
} from "../../util/feedle-note-utils";

import useObsidianApp from "../hooks/useObsidianApp";
import { App } from "obsidian";
import { FeedEntry } from "@extractus/feed-extractor";

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
	onFavoriteChange?: (item: RSSItem) => void;
	onSaveChange?: (item: RSSItem) => void;
};

export default function RSSListItem(props: RSSItemProps) {
	let app = useObsidianApp() as App;

	return (
		<li className="flex gap-1 items-center">
			<button className="w-8" onClick={() => handleFavoriteButton(props.item)}>
				<StarIcon fillColor={props.isFavorite ? "currentColor" : "unset"} />
			</button>{" "}
			<button className="w-8" onClick={() => handleSaveButton(props.item)}>
				<BookmarkIcon fillColor={props.isSaved ? "currentColor" : "unset"} />
			</button>{" "}
			<a href={props.item.link} className="truncate flex-1">
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
