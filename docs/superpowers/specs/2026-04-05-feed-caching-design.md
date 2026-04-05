# Feed Caching Design

**Date:** 2026-04-05
**Status:** Approved

## Overview

Add a session-scoped, URL-keyed feed cache to avoid redundant network requests when
opening/closing notes or aggregating across multiple feedle blocks. Cache duration is
user-configurable (default 15 minutes) and stored in plugin settings.

## Goals

- Avoid refetching a feed URL more than once per cache window within a session
- Support future feed aggregation: walk all feedle blocks in the vault, serve from cache,
  revalidate stale entries individually
- Let users control cache duration via the Settings tab

## Non-Goals

- Persistent cache across Obsidian restarts (session-only is sufficient)
- Per-feed cache duration overrides (single global setting for now)

## Architecture

### `FeedCache` (`src/util/FeedCache.ts`)

A class that owns an in-memory `Map<string, { data: FeedData; fetchedAt: number }>`.

```ts
class FeedCache {
  private cache: Map<string, { data: FeedData; fetchedAt: number }> = new Map();

  async get(url: string, cacheDurationMs: number): Promise<FeedData>
}
```

`get()` logic:
1. Check if a cache entry exists for `url` and `Date.now() - fetchedAt < cacheDurationMs`
2. If fresh → return `entry.data`
3. If stale or missing → call `requestUrl`, parse with `extractFromXml`, sort entries by
   published date, store result with current timestamp, return data

### Settings (`src/main.tsx`)

Add `cacheDurationMinutes: number` to `FeedleSettings` with default `15`.

Register `SampleSettingTab` (rename to `FeedleSettingTab`) on the plugin so it appears in
Obsidian's settings. Add a number input for cache duration (label: "Feed cache duration
(minutes)").

### Context (`src/main.tsx`)

Export a new `FeedCacheContext` (alongside the existing `ObsidianAppContext`) that provides
the `FeedCache` instance. Both are provided at the render root in the markdown block processor.

### `FeedleApp` (`src/render/FeedleApp.tsx`)

Replace the inline `requestUrl` + `extractFromXml` block with a call to
`feedCache.get(url, cacheDurationMs)` obtained from context.

Pass `cacheDurationMinutes * 60 * 1000` as `cacheDurationMs`.

## Data Flow

```
Open note with feedle block
  → FeedleApp mounts
  → reads cacheDurationMinutes from settings context
  → calls feedCache.get(url, duration)
    → cache hit & fresh  → return data immediately
    → cache miss / stale → requestUrl → parse → store → return data
  → setRSSData(data)
  → render items
```

Future aggregation:
```
Aggregator collects all feedle URLs from vault
  → for each url: feedCache.get(url, duration)
  → stale/missing entries refetch in parallel
  → fresh entries return instantly
  → merge + deduplicate results
```

## Files Changed

| File | Change |
|------|--------|
| `src/util/FeedCache.ts` | **New** — cache class |
| `src/main.tsx` | Add `cacheDurationMinutes` setting, `FeedCacheContext`, register settings tab |
| `src/render/FeedleApp.tsx` | Use `feedCache.get()` instead of inline fetch |

## Error Handling

If `requestUrl` throws, propagate the error — `FeedleApp` already renders a fallback
("Could not load feed data.") when `rssData` is undefined.

## Testing

Manual verification:
1. Open a note with a feedle block — confirm network request fires
2. Close and reopen the note within 15 min — confirm no new network request (check DevTools)
3. Wait past cache duration — confirm refetch occurs
4. Change cache duration in settings — confirm new duration is respected on next stale check
