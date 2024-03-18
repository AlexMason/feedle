# Feedle for Obsidian

Feedle is an innovative RSS feed manager plugin designed specifically for Obsidian.md users who want to seamlessly integrate news feeds into their notes. With Feedle, staying updated with your favorite websites and incorporating valuable insights into your notes has never been easier. Simply insert a Feedle code block with a URL, and let Feedle enrich your notes with the latest content.

## Why did you create Feedle?

I wanted a drop in RSS solution that just worked, without complicated menus and navigation. While this may lead to a more limited or conservative features set, I believe it offers a more text-based rss feed experience. I look to strike an ideal balance between functionality and configurability, allowing you to tweak the core of the plugin. This will be priority work after the initial MVP is launch and bug are worked out.  It will definitely be in place before v1.

## Features

- **Easy RSS Integration**: Add RSS feeds directly into your Obsidian notes with a simple code block.
- **Automatic Pagination**: Effortlessly browse through feed entries with built-in pagination.
- **Favorites**: Mark entries as favorites for quick access and reference, enhancing your note-taking workflow.
- **Save Articles**: Automatically retrieve article content and ingest it into obsidian for easy viewing and note enrichment.
- **Youtube Video Support**: Detect if the entry is from a youtube channel, and display the video embedded in the note when saved.

## Installation

1. Open Obsidian and navigate to **Settings** > **Community Plugins**.
2. Disable **Safe Mode**.
3. Click on **Browse** and search for **Feedle**.
4. Install the plugin and then enable it from the list of installed plugins.

## Usage

To start using Feedle, insert a code block into your note and specify the RSS feed URL as follows:

\`\`\`feedle
url: https://example.com/feed
\`\`\`

Feedle will automatically fetch and display the feed entries within your note.

## Contributing

We welcome contributions and suggestions to make Feedle even better! If you're interested in contributing, please follow these steps:

1. **Fork** the repository on GitHub.
2. **Clone** your fork to your local machine.
3. **Create a new branch** for your feature or fix.
4. **Make your changes** and **test** them thoroughly.
5. **Commit** your changes with a clear and descriptive message.
6. **Push** your changes to your fork on GitHub.
7. **Submit a Pull Request** (PR) to the main repository.

We use a simple PR management strategy to ensure that contributions are reviewed and integrated efficiently. Please provide as much information as possible about your changes, including how they improve Feedle or fix an issue.

## Dependencies

Feedle relies on `@extractus` packages for parsing RSS feed data, Obsidian API's for interacting with editor content, and uses React and Tailwind CSS for rendering custom views.

## Roadmap

I plan to continue to iterate on Feedle until I am happy with it's functionality and it works reliably.

## License

Feedle is open-source software licensed under the MIT License. See the LICENSE file for more details.

## Acknowledgments

Thanks to the Obsidian.md community for their invaluable support and to all contributors of Feedle for making this project possible.

---

Feedle is not officially affiliated with Obsidian.md.
