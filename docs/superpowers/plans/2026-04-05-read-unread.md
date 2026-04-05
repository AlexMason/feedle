# Read/Unread Feed Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist read/unread state for feed items in the Obsidian note and visually mute read items with a strikethrough title.

**Architecture:** A `## Read` section is added to the note (mirroring `## Favorites`). `feedle-note-utils.ts` gets `addRead`/`removeRead`/`getReadFromNote` helpers. `FeedleApp` tracks `readContent` state and passes `isRead` + `onReadChange` down to `RSSListItem`. Clicking a link marks it read and applies `opacity-50 line-through` styling.

**Tech Stack:** TypeScript, React, Obsidian Plugin API, Tailwind CSS

---

### Task 1: Add read persistence helpers to feedle-note-utils.ts

**Files:**
- Modify: `src/util/feedle-note-utils.ts`

- [ ] **Step 1: Add `getReadFromNote`**

In `src/util/feedle-note-utils.ts`, add after `getSavedFromNote`:

```typescript
export function getReadFromNote(note: string): string {
	let readLines = extractLines(
		note,
		(line) => line.trim() === "## Read",
		(line) => line.trim().startsWith("## ")
	);

	return readLines.content;
}
```

- [ ] **Step 2: Add `addRead`**

Add after `getReadFromNote`:

```typescript
export function addRead(editor: Editor, item: RSSItem) {
	let fileContentRaw = editor.getValue();

	const feedleNoteConfig = getFeedleNoteConfig(fileContentRaw);
	if (!feedleNoteConfig) return;

	const read = getReadFromNote(fileContentRaw);
	if (read.includes(item.link!)) return;

	fileContentRaw = addHeaderIfNotExists(
		fileContentRaw,
		2,
		"Read",
		(_, idx) => idx === feedleNoteConfig.blockEndIndex + 1
	);

	fileContentRaw = addLineBelowHeader(
		fileContentRaw,
		"Read",
		` - [${item.title}](${item.link})`
	);

	editor.setValue(fileContentRaw);
}
```

- [ ] **Step 3: Add `removeRead`**

Add after `addRead`:

```typescript
export function removeRead(editor: Editor, item: RSSItem) {
	let newContent = deleteLines(editor, (line) =>
		line.includes(`(${item.link})`)
	);

	editor.setValue(newContent);
}
```

- [ ] **Step 4: Verify the file compiles**

Run: `cd "/home/alexmason/Documents/2026 Vault/.obsidian/plugins/feedle" && npm run build 2>&1 | tail -20`

Expected: No TypeScript errors related to feedle-note-utils.ts

- [ ] **Step 5: Commit**

```bash
cd "/home/alexmason/Documents/2026 Vault/.obsidian/plugins/feedle"
git add src/util/feedle-note-utils.ts
git commit -m "feat: add addRead/removeRead/getReadFromNote to feedle-note-utils"
```

---

### Task 2: Wire read state into FeedleApp

**Files:**
- Modify: `src/render/FeedleApp.tsx`

- [ ] **Step 1: Import new helpers**

At the top of `src/render/FeedleApp.tsx`, add `getReadFromNote` to the existing import from `feedle-note-utils`:

```typescript
import {
	getFavoritesFromNote,
	getFeedleNoteConfig,
	getSavedFromNote,
	getReadFromNote,
	santizeFileName,
} from "src/util/feedle-note-utils";
```

- [ ] **Step 2: Add readContent state**

After the existing `savedContent` state declaration (line ~31), add:

```typescript
let [readContent, setReadContent] = useState<string>("");
```

- [ ] **Step 3: Load readContent in useEffect**

Inside the `useEffect`, after the `setSavedContent(...)` call, add:

```typescript
setReadContent(
	getReadFromNote(app.workspace.activeEditor.editor.getValue())
);
```

- [ ] **Step 4: Pass isRead and onReadChange to RSSListItem**

In the `rssData.entries.slice(...).map(...)` block, add two props to `<RSSListItem>`:

```tsx
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
```

- [ ] **Step 5: Add handleReadChange**

After `handleSavedChange`, add:

```typescript
function handleReadChange() {
	if (app && app.workspace.activeEditor?.editor) {
		setReadContent(
			getReadFromNote(app.workspace.activeEditor.editor.getValue())
		);
	}
}
```

- [ ] **Step 6: Verify build**

Run: `cd "/home/alexmason/Documents/2026 Vault/.obsidian/plugins/feedle" && npm run build 2>&1 | tail -20`

Expected: No TypeScript errors

- [ ] **Step 7: Commit**

```bash
cd "/home/alexmason/Documents/2026 Vault/.obsidian/plugins/feedle"
git add src/render/FeedleApp.tsx
git commit -m "feat: wire readContent state and handleReadChange into FeedleApp"
```

---

### Task 3: Add isRead prop and click-to-read styling to RSSListItem

**Files:**
- Modify: `src/render/components/RSSItem.tsx`

- [ ] **Step 1: Import addRead**

Update the import from `feedle-note-utils` to include `addRead`:

```typescript
import {
	addFavorite,
	addSaved,
	addRead,
	removeFavorite,
	removeSaved,
} from "../../util/feedle-note-utils";
```

- [ ] **Step 2: Add isRead and onReadChange to props type**

Update `RSSItemProps`:

```typescript
type RSSItemProps = {
	item: FeedEntry;
	isFavorite: boolean;
	isSaved: boolean;
	isRead: boolean;
	onFavoriteChange?: (item: RSSItem) => void;
	onSaveChange?: (item: RSSItem) => void;
	onReadChange?: (item: RSSItem) => void;
};
```

- [ ] **Step 3: Apply conditional styling and onClick to the title link**

Replace the existing `<a>` element:

```tsx
<a
	href={props.item.link}
	className={`truncate flex-1${props.isRead ? " opacity-50 line-through" : ""}`}
	onClick={() => handleReadClick(props.item)}
>
	{props.item.title}
</a>
```

- [ ] **Step 4: Add handleReadClick**

Add inside the component, after `handleRemoveFavorite`:

```typescript
function handleReadClick(item: RSSItem) {
	if (!props.isRead) {
		if (app && app.workspace.activeEditor?.editor) {
			addRead(app.workspace.activeEditor.editor, item);
		}
		props.onReadChange && props.onReadChange(item);
	}
}
```

- [ ] **Step 5: Verify build**

Run: `cd "/home/alexmason/Documents/2026 Vault/.obsidian/plugins/feedle" && npm run build 2>&1 | tail -20`

Expected: Clean build, no TypeScript errors

- [ ] **Step 6: Commit**

```bash
cd "/home/alexmason/Documents/2026 Vault/.obsidian/plugins/feedle"
git add src/render/components/RSSItem.tsx
git commit -m "feat: mark items read on link click, style read items with strikethrough and muted text"
```

---

### Task 4: Manual smoke test

**Files:** None (verification only)

- [ ] **Step 1: Load the plugin in Obsidian**

Open Obsidian, open a note with a `feedle` block, confirm feed items load.

- [ ] **Step 2: Click a feed item link**

The item's title should immediately show with `opacity-50` (muted) and `line-through` (strikethrough).

- [ ] **Step 3: Reload the note**

Close and reopen the note (or reload Obsidian). The item should still appear as read — confirm a `## Read` section was added to the note with the item's link.

- [ ] **Step 4: Verify other items unaffected**

Unread items should display normally. Favorites and saved state should be unaffected.
