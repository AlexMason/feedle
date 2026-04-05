# Read/Unread Feed Items — Design Spec

**Date:** 2026-04-05

## Overview

Add read/unread state to feed items. Read items display with a strikethrough title and muted text. State persists to the Obsidian note under a `## Read` section, mirroring the existing favorites pattern.

## Data Layer (`feedle-note-utils.ts`)

Add four functions following the exact shape of the favorites functions:

- `addRead(editor, item)` — appends ` - [title](link)` under `## Read`, creating the section after the feedle block if it doesn't exist
- `removeRead(editor, item)` — deletes the line containing `(item.link)`
- `getReadFromNote(note: string): string` — extracts content under `## Read` using `extractLines`
- Read state is derived by checking `readContent.includes(item.link!)`

The `## Read` section is inserted at `feedleNoteConfig.blockEndIndex + 1` (same position as Favorites) if it doesn't exist.

## State (`FeedleApp.tsx`)

- Add `readContent` state: `useState<string>("")`
- Load it in the existing `useEffect` alongside `favoriteContent` and `savedContent`
- Pass `isRead={readContent.includes(item.link!)}` and `onReadChange={handleReadChange}` to each `RSSListItem`
- Add `handleReadChange()` that re-reads `getReadFromNote(editor.getValue())` into `readContent`

## UI (`RSSItem.tsx`)

- Add props: `isRead: boolean`, `onReadChange?: (item: RSSItem) => void`
- Add `onClick` handler to the title `<a>` tag: if not already read, call `addRead` then `onReadChange`
- When `isRead` is true, apply Tailwind classes `opacity-50 line-through` to the title `<a>`
- No new button — clicking the link is the read trigger

## Styling

Title `<a>` element classes:
- Default: `truncate flex-1`
- When read: `truncate flex-1 opacity-50 line-through`

No new CSS files needed — existing Tailwind setup covers this.

## What Is Not Changing

- No "mark unread" interaction (read is one-way via link click)
- No bulk "mark all read" action
- No visual indicator beyond title styling (no icon, no badge)
