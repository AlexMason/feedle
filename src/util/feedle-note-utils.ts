import { Editor, requestUrl } from "obsidian";
import { RSSItem } from "src/render/components/RSSItem";
import { App } from "obsidian";
import unfluff from "unfluffjs";
import * as cheerio from "cheerio";

export async function addSaved(app: App, editor: Editor, item: RSSItem) {
	// get article content and save as new note
	let fileContentRaw = editor.getValue();

	const feedleNoteConfig = getFeedleNoteConfig(fileContentRaw);
	if (!feedleNoteConfig) return;

	const saved = getSavedFromNote(fileContentRaw);
	if (saved.includes(item.title!)) return;

	const favorites = extractLines(
		fileContentRaw,
		(l) => l.trim() === "## Saved",
		(l) => l.trim().startsWith("##")
	);

	let savedInsertIdx =
		favorites.endLineIdx !== -1
			? favorites.endLineIdx
			: feedleNoteConfig.blockEndIndex + 1;

	fileContentRaw = addHeaderIfNotExists(
		fileContentRaw,
		2,
		"Saved",
		(_, idx) => idx === savedInsertIdx
	);

	fileContentRaw = addLineBelowHeader(
		fileContentRaw,
		"Saved",
		` - [[${santizeFileName(item.title!)}]]`
	);

	const savedNoteFolderPath =
		app.workspace.activeEditor?.file?.parent?.name ===
		app.workspace.activeEditor?.file?.basename
			? app.workspace.activeEditor?.file?.parent?.path
			: app.workspace.activeEditor?.file?.parent?.path +
			  "/" +
			  app.workspace.activeEditor?.file?.basename;

	if (
		app.workspace.activeEditor &&
		app.workspace.activeEditor.file &&
		app.workspace.activeEditor.file.parent &&
		app.vault.getFolderByPath(savedNoteFolderPath!) == null
	) {
		app.vault.createFolder(savedNoteFolderPath!);
	}

	let res = await requestUrl(item.link!);
	let content = unfluff(res.text);
	let contentText = content.text;

	if (item.id.startsWith("yt:video:")) {
		contentText = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${
			item.id.split(":video:")[1]
		}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
	}

	try {
		await app.vault.create(
			savedNoteFolderPath + `/${santizeFileName(item.title!)}.md`,
			SAVED_NOTE_TEMPLATE(item, contentText)
		);
	} catch (error) {
		// console.error(error);
	}

	console.log("basename", app.workspace.activeEditor?.file?.basename);
	console.log("parent", app.workspace.activeEditor?.file?.parent);
	console.log("path", app.workspace.activeEditor?.file?.path);

	editor.setValue(fileContentRaw);
}

//TODO: Add pubdate, content, turn it into a real function
const SAVED_NOTE_TEMPLATE = (item: RSSItem, contentText: string) => `---
type: feedle-note
title: "${item.title}"
link: "${item.link}"
published: "${item.published}"
description: "${item.description}"
---

## Content
${contentText}

## Notes
`;

export function removeSaved(editor: Editor, item: RSSItem) {
	let newContent = deleteLines(editor, (line) =>
		line.includes("[[" + santizeFileName(item.title!) + "]]")
	);

	editor.setValue(newContent);
}

export function santizeFileName(name: string) {
	const INVALID_FILENAME_REGEX = /[\*\"\\\/\<\>\:\|\?]/;
	return name.replace(INVALID_FILENAME_REGEX, "");
}

export function addFavorite(editor: Editor, item: RSSItem) {
	let fileContentRaw = editor.getValue();

	const feedleNoteConfig = getFeedleNoteConfig(fileContentRaw);
	if (!feedleNoteConfig) return;

	const favorites = getFavoritesFromNote(fileContentRaw);
	// If the URL is already in the favorites, we don't need to add it again
	if (favorites.includes(item.link!)) return;

	// create favorites section if doesn't exist
	fileContentRaw = addHeaderIfNotExists(
		fileContentRaw,
		2,
		"Favorites",
		(_, idx) => idx === feedleNoteConfig.blockEndIndex + 1
	);

	fileContentRaw = addLineBelowHeader(
		fileContentRaw,
		"Favorites",
		` - [${item.title}](${item.link})`
	);

	editor.setValue(fileContentRaw);
}

export function removeFavorite(editor: Editor, item: RSSItem) {
	let newContent = deleteLines(editor, (line) =>
		line.includes(`(${item.link})`)
	);

	editor.setValue(newContent);
}

function addHeaderIfNotExists(
	note: string,
	level: number,
	text: string,
	insertCondition: (line: string, idx: number) => boolean
) {
	let headerText = new Array(level).fill("#").join("") + " " + text;
	console.log("headerText", headerText);

	let fileContent = note.split("\n");
	if (fileContent.some((line) => line.trim() === headerText)) return note;

	let insertIdx = -1;

	for (let idx = 0; idx < fileContent.length; idx++) {
		let line = fileContent[idx];

		if (!insertCondition(line, idx)) continue;

		insertIdx = idx + 1;
		break;
	}

	if (insertIdx === -1) insertIdx = fileContent.length;

	fileContent.splice(insertIdx, 0, headerText);

	return fileContent.join("\n");
}

function addLineBelowHeader(
	note: string,
	headerText: string,
	lineText: string
) {
	let fileContent = note.split("\n");
	let indexOfHeader = -1;

	if (indexOfHeader === -1) {
		for (let idx = 0; idx < fileContent.length; idx++) {
			if (!fileContent[idx].trim().endsWith("# " + headerText)) continue;
			indexOfHeader = idx;
			break;
		}
	}

	if (indexOfHeader === -1) {
		console.error("Could not find header: " + headerText);
	} else {
		fileContent.splice(indexOfHeader + 1, 0, lineText);
	}

	return fileContent.join("\n");
}

export function deleteLines(
	editor: Editor,
	condition: (line: string) => boolean
) {
	const fileContentLines = editor.getValue().split("\n");

	return fileContentLines.filter((line) => !condition(line)).join("\n");
}

export function getFavoritesFromNote(note: string): string {
	let favoriteLines = extractLines(
		note,
		(line) => line.trim() === "## Favorites",
		(line) => line.trim().startsWith("## ")
	);

	return favoriteLines.content;
}

export function getSavedFromNote(note: string): string {
	let savedLines = extractLines(
		note,
		(line) => line.trim() === "## Saved",
		(line) => line.trim().startsWith("## ")
	);

	return savedLines.content;
}

export function getFeedleNoteConfig(note: string) {
	let properities: Record<string, string> = {};

	let feedleLines = extractLines(
		note,
		(line) => line.trim() === "```feedle",
		(line) => line.trim() === "```"
	);

	for (let line of feedleLines.content.split("\n")) {
		const [key, ...values] = line.split(":");
		const value = values.join(":").trim();
		if (key && key.trim().length > 0 && value && value.length > 0) {
			properities[key.trim()] = value;
		}
	}

	if (feedleLines.endLineIdx === -1) {
		console.error("Unable to find the end of the feedle block.");
		return;
	}

	return {
		blockStartIndex: feedleLines.startLineIdx,
		blockEndIndex: feedleLines.endLineIdx,
		properities,
	};
}

/**
 * Iterates over each line in `note` delimited by `\n` line breaks.
 * If the `startCondition` has been met, then all subsequent lines
 * will be stored in the output until the `endCondition` is met.
 */
function extractLines(
	note: string,
	startCondition: (line: string) => boolean,
	endCondition: (line: string) => boolean
) {
	let fileContent = note.split("\n");

	let foundFavStart = false;
	let startLineIdx = -1;
	let endLineIdx = -1;

	let content = "";

	for (let idx = 0; idx < fileContent.length; idx++) {
		let line = fileContent[idx];
		if (endCondition(line) && foundFavStart) {
			endLineIdx = idx;
			break;
		}
		if (foundFavStart) {
			content += line + "\n";
		}
		if (startCondition(line)) {
			startLineIdx = idx;
			foundFavStart = true;
		}
	}

	if (endLineIdx === -1) {
		endLineIdx = fileContent.length;
	}

	return {
		startLineIdx,
		endLineIdx,
		content,
	};
}
