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

		const data = await extractFromXml(res.text);
		data.entries = data.entries?.sort(
			(a, b) =>
				(new Date(b.published || "").getTime() || 0) -
				(new Date(a.published || "").getTime() || 0)
		);

		this.cache.set(url, { data, fetchedAt: Date.now() });
		return data;
	}
}
