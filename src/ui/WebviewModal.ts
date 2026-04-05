import { Modal, App } from "obsidian";

// Electron is provided by Obsidian's runtime — never bundled
const { remote } = require("electron");

interface BrowserChrome {
	urlBar: HTMLInputElement;
	backBtn: HTMLButtonElement;
	forwardBtn: HTMLButtonElement;
	refreshBtn: HTMLButtonElement;
	externalBtn: HTMLButtonElement;
}

export class WebviewModal extends Modal {
	private url: string;
	private browserView: Electron.BrowserView | null = null;
	private chrome: BrowserChrome | null = null;
	private resizeObserver: ResizeObserver | null = null;

	constructor(app: App, url: string) {
		super(app);
		this.url = url;
	}

	onOpen(): void {
		this.buildModalShell();
		this.buildBrowserChrome();
		this.mountBrowserView();
		this.observeResize();
	}

	onClose(): void {
		this.resizeObserver?.disconnect();
		this.teardownBrowserView();
		this.contentEl.empty();
	}

	// --- Layout ---

	/** Build the modal container — full bleed, no default padding */
	private buildModalShell(): void {
		const { modalEl } = this;
		modalEl.style.cssText = `
			width: 90vw;
			height: 85vh;
			max-width: 90vw;
			max-height: 85vh;
			padding: 0;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		`;
	}

	/** Render a slim toolbar above the BrowserView area */
	private buildBrowserChrome(): void {
		const toolbar = this.contentEl.createDiv({ cls: "wv-toolbar" });
		toolbar.style.cssText = `
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 6px 8px;
			border-bottom: 1px solid var(--background-modifier-border);
			background: var(--background-secondary);
			flex-shrink: 0;
		`;

		const backBtn = toolbar.createEl("button", { text: "←" });
		const forwardBtn = toolbar.createEl("button", { text: "→" });
		const refreshBtn = toolbar.createEl("button", { text: "↺" });

		const urlBar = toolbar.createEl("input", { type: "text" });
		urlBar.value = this.url;
		urlBar.style.cssText = `flex: 1; font-size: 12px;`;

		const externalBtn = toolbar.createEl("button", { text: "↗ Open in Browser" });

		this.chrome = { urlBar, backBtn, forwardBtn, refreshBtn, externalBtn };
		this.bindChromeEvents();
	}

	// --- BrowserView ---

	/** Attach a real Electron BrowserView to the current OS window */
	private mountBrowserView(): void {
		const win = remote.getCurrentWindow();

		const view = new remote.BrowserView({
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				sandbox: true,
			},
		});

		win.addBrowserView(view);
		this.browserView = view;

		// Sync URL bar and nav button state as page navigates
		view.webContents.on("did-navigate", (_: unknown, url: string) => {
			this.url = url;
			if (this.chrome) this.chrome.urlBar.value = url;
			this.updateNavButtons();
		});

		view.webContents.on("did-navigate-in-page", (_: unknown, url: string) => {
			this.url = url;
			if (this.chrome) this.chrome.urlBar.value = url;
		});

		view.webContents.loadURL(this.url);

		// Defer bounds sync until DOM has painted
		requestAnimationFrame(() => this.syncBounds());
	}

	/** Destroy the BrowserView and remove it from the OS window */
	private teardownBrowserView(): void {
		if (!this.browserView) return;
		const win = remote.getCurrentWindow();
		win.removeBrowserView(this.browserView);
		// destroy() exists at runtime but may be missing from type definitions
		(this.browserView.webContents as any).destroy();
		this.browserView = null;
	}

	// --- Bounds Syncing ---

	/**
	 * BrowserView is painted on the OS window surface, outside the DOM.
	 * We have to manually position it to sit below the chrome toolbar.
	 * Electron's setBounds uses logical pixels — no DPR scaling needed.
	 */
	private syncBounds(): void {
		if (!this.browserView) return;

		const toolbar = this.contentEl.querySelector(".wv-toolbar");
		const toolbarHeight = toolbar?.getBoundingClientRect().height ?? 40;
		const modalRect = this.modalEl.getBoundingClientRect();
		const pad = parseFloat(getComputedStyle(document.documentElement).fontSize); // 1rem in px

		// setBounds uses logical pixels — do NOT multiply by devicePixelRatio
		this.browserView.setBounds({
			x: Math.round(modalRect.left + pad),
			y: Math.round(modalRect.top + toolbarHeight + pad),
			width: Math.round(modalRect.width - pad * 2),
			height: Math.round(modalRect.height - toolbarHeight - pad * 2),
		});
	}

	/** Watch for modal resize (e.g. window resize) and re-sync bounds */
	private observeResize(): void {
		this.resizeObserver = new ResizeObserver(() => this.syncBounds());
		this.resizeObserver.observe(this.modalEl);
	}

	// --- Chrome Event Binding ---

	private bindChromeEvents(): void {
		if (!this.chrome) return;
		const { backBtn, forwardBtn, refreshBtn, urlBar, externalBtn } = this.chrome;

		backBtn.addEventListener("click", () => {
			this.browserView?.webContents.goBack();
		});

		forwardBtn.addEventListener("click", () => {
			this.browserView?.webContents.goForward();
		});

		refreshBtn.addEventListener("click", () => {
			this.browserView?.webContents.reload();
		});

		// Navigate on Enter in URL bar
		urlBar.addEventListener("keydown", (e) => {
			if (e.key !== "Enter") return;
			const raw = urlBar.value.trim();
			const url = raw.startsWith("http") ? raw : `https://${raw}`;
			this.browserView?.webContents.loadURL(url);
		});

		externalBtn.addEventListener("click", () => {
			// Use Obsidian's shell open — respects user's default browser
			(window as any).require("electron").shell.openExternal(this.url);
		});
	}

	/** Enable/disable back and forward buttons based on navigation history */
	private updateNavButtons(): void {
		if (!this.chrome || !this.browserView) return;
		this.chrome.backBtn.disabled = !this.browserView.webContents.canGoBack();
		this.chrome.forwardBtn.disabled = !this.browserView.webContents.canGoForward();
	}
}
