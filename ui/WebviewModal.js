import { Modal } from "obsidian";
// Electron is provided by Obsidian's runtime — never bundled
const { remote } = require("electron");
export class WebviewModal extends Modal {
    constructor(app, url) {
        super(app);
        this.browserView = null;
        this.chrome = null;
        this.resizeObserver = null;
        this.url = url;
    }
    onOpen() {
        this.buildModalShell();
        this.buildBrowserChrome();
        this.mountBrowserView();
        this.observeResize();
    }
    onClose() {
        var _a;
        (_a = this.resizeObserver) === null || _a === void 0 ? void 0 : _a.disconnect();
        this.teardownBrowserView();
        this.contentEl.empty();
    }
    // --- Layout ---
    /** Build the modal container — full bleed, no default padding */
    buildModalShell() {
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
    buildBrowserChrome() {
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
    mountBrowserView() {
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
        view.webContents.on("did-navigate", (_, url) => {
            this.url = url;
            if (this.chrome)
                this.chrome.urlBar.value = url;
            this.updateNavButtons();
        });
        view.webContents.on("did-navigate-in-page", (_, url) => {
            this.url = url;
            if (this.chrome)
                this.chrome.urlBar.value = url;
        });
        view.webContents.loadURL(this.url);
        // Defer bounds sync until DOM has painted
        requestAnimationFrame(() => this.syncBounds());
    }
    /** Destroy the BrowserView and remove it from the OS window */
    teardownBrowserView() {
        if (!this.browserView)
            return;
        const win = remote.getCurrentWindow();
        win.removeBrowserView(this.browserView);
        // destroy() exists at runtime but may be missing from type definitions
        this.browserView.webContents.destroy();
        this.browserView = null;
    }
    // --- Bounds Syncing ---
    /**
     * BrowserView is painted on the OS window surface, outside the DOM.
     * We have to manually position it to sit below the chrome toolbar.
     * Electron's setBounds uses logical pixels — no DPR scaling needed.
     */
    syncBounds() {
        var _a;
        if (!this.browserView)
            return;
        const toolbar = this.contentEl.querySelector(".wv-toolbar");
        const toolbarHeight = (_a = toolbar === null || toolbar === void 0 ? void 0 : toolbar.getBoundingClientRect().height) !== null && _a !== void 0 ? _a : 40;
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
    observeResize() {
        this.resizeObserver = new ResizeObserver(() => this.syncBounds());
        this.resizeObserver.observe(this.modalEl);
    }
    // --- Chrome Event Binding ---
    bindChromeEvents() {
        if (!this.chrome)
            return;
        const { backBtn, forwardBtn, refreshBtn, urlBar, externalBtn } = this.chrome;
        backBtn.addEventListener("click", () => {
            var _a;
            (_a = this.browserView) === null || _a === void 0 ? void 0 : _a.webContents.goBack();
        });
        forwardBtn.addEventListener("click", () => {
            var _a;
            (_a = this.browserView) === null || _a === void 0 ? void 0 : _a.webContents.goForward();
        });
        refreshBtn.addEventListener("click", () => {
            var _a;
            (_a = this.browserView) === null || _a === void 0 ? void 0 : _a.webContents.reload();
        });
        // Navigate on Enter in URL bar
        urlBar.addEventListener("keydown", (e) => {
            var _a;
            if (e.key !== "Enter")
                return;
            const raw = urlBar.value.trim();
            const url = raw.startsWith("http") ? raw : `https://${raw}`;
            (_a = this.browserView) === null || _a === void 0 ? void 0 : _a.webContents.loadURL(url);
        });
        externalBtn.addEventListener("click", () => {
            // Use Obsidian's shell open — respects user's default browser
            window.require("electron").shell.openExternal(this.url);
        });
    }
    /** Enable/disable back and forward buttons based on navigation history */
    updateNavButtons() {
        if (!this.chrome || !this.browserView)
            return;
        this.chrome.backBtn.disabled = !this.browserView.webContents.canGoBack();
        this.chrome.forwardBtn.disabled = !this.browserView.webContents.canGoForward();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2Vidmlld01vZGFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3VpL1dlYnZpZXdNb2RhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsS0FBSyxFQUFPLE1BQU0sVUFBVSxDQUFDO0FBRXRDLDZEQUE2RDtBQUM3RCxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBVXZDLE1BQU0sT0FBTyxZQUFhLFNBQVEsS0FBSztJQU10QyxZQUFZLEdBQVEsRUFBRSxHQUFXO1FBQ2hDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUxKLGdCQUFXLEdBQWdDLElBQUksQ0FBQztRQUNoRCxXQUFNLEdBQXlCLElBQUksQ0FBQztRQUNwQyxtQkFBYyxHQUEwQixJQUFJLENBQUM7UUFJcEQsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDaEIsQ0FBQztJQUVELE1BQU07UUFDTCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDdkIsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxPQUFPOztRQUNOLE1BQUEsSUFBSSxDQUFDLGNBQWMsMENBQUUsVUFBVSxFQUFFLENBQUM7UUFDbEMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN4QixDQUFDO0lBRUQsaUJBQWlCO0lBRWpCLGlFQUFpRTtJQUN6RCxlQUFlO1FBQ3RCLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDekIsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUc7Ozs7Ozs7OztHQVN2QixDQUFDO0lBQ0gsQ0FBQztJQUVELHVEQUF1RDtJQUMvQyxrQkFBa0I7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LE9BQU87WUFDOUIsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNoQyxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDNUQsTUFBQSxJQUFJLENBQUMsV0FBVywwQ0FBRSxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO1FBRUgsV0FBVyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDMUMsOERBQThEO1lBQzdELE1BQWMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbEUsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsMEVBQTBFO0lBQ2xFLGdCQUFnQjtRQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXO1lBQUUsT0FBTztRQUM5QyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN6RSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNoRixDQUFDO0NBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RhbCwgQXBwIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbi8vIEVsZWN0cm9uIGlzIHByb3ZpZGVkIGJ5IE9ic2lkaWFuJ3MgcnVudGltZSDigJQgbmV2ZXIgYnVuZGxlZFxuY29uc3QgeyByZW1vdGUgfSA9IHJlcXVpcmUoXCJlbGVjdHJvblwiKTtcblxuaW50ZXJmYWNlIEJyb3dzZXJDaHJvbWUge1xuXHR1cmxCYXI6IEhUTUxJbnB1dEVsZW1lbnQ7XG5cdGJhY2tCdG46IEhUTUxCdXR0b25FbGVtZW50O1xuXHRmb3J3YXJkQnRuOiBIVE1MQnV0dG9uRWxlbWVudDtcblx0cmVmcmVzaEJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQ7XG5cdGV4dGVybmFsQnRuOiBIVE1MQnV0dG9uRWxlbWVudDtcbn1cblxuZXhwb3J0IGNsYXNzIFdlYnZpZXdNb2RhbCBleHRlbmRzIE1vZGFsIHtcblx0cHJpdmF0ZSB1cmw6IHN0cmluZztcblx0cHJpdmF0ZSBicm93c2VyVmlldzogRWxlY3Ryb24uQnJvd3NlclZpZXcgfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSBjaHJvbWU6IEJyb3dzZXJDaHJvbWUgfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSByZXNpemVPYnNlcnZlcjogUmVzaXplT2JzZXJ2ZXIgfCBudWxsID0gbnVsbDtcblxuXHRjb25zdHJ1Y3RvcihhcHA6IEFwcCwgdXJsOiBzdHJpbmcpIHtcblx0XHRzdXBlcihhcHApO1xuXHRcdHRoaXMudXJsID0gdXJsO1xuXHR9XG5cblx0b25PcGVuKCk6IHZvaWQge1xuXHRcdHRoaXMuYnVpbGRNb2RhbFNoZWxsKCk7XG5cdFx0dGhpcy5idWlsZEJyb3dzZXJDaHJvbWUoKTtcblx0XHR0aGlzLm1vdW50QnJvd3NlclZpZXcoKTtcblx0XHR0aGlzLm9ic2VydmVSZXNpemUoKTtcblx0fVxuXG5cdG9uQ2xvc2UoKTogdm9pZCB7XG5cdFx0dGhpcy5yZXNpemVPYnNlcnZlcj8uZGlzY29ubmVjdCgpO1xuXHRcdHRoaXMudGVhcmRvd25Ccm93c2VyVmlldygpO1xuXHRcdHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cdH1cblxuXHQvLyAtLS0gTGF5b3V0IC0tLVxuXG5cdC8qKiBCdWlsZCB0aGUgbW9kYWwgY29udGFpbmVyIOKAlCBmdWxsIGJsZWVkLCBubyBkZWZhdWx0IHBhZGRpbmcgKi9cblx0cHJpdmF0ZSBidWlsZE1vZGFsU2hlbGwoKTogdm9pZCB7XG5cdFx0Y29uc3QgeyBtb2RhbEVsIH0gPSB0aGlzO1xuXHRcdG1vZGFsRWwuc3R5bGUuY3NzVGV4dCA9IGBcblx0XHRcdHdpZHRoOiA5MHZ3O1xuXHRcdFx0aGVpZ2h0OiA4NXZoO1xuXHRcdFx0bWF4LXdpZHRoOiA5MHZ3O1xuXHRcdFx0bWF4LWhlaWdodDogODV2aDtcblx0XHRcdHBhZGRpbmc6IDA7XG5cdFx0XHRkaXNwbGF5OiBmbGV4O1xuXHRcdFx0ZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcblx0XHRcdG92ZXJmbG93OiBoaWRkZW47XG5cdFx0YDtcblx0fVxuXG5cdC8qKiBSZW5kZXIgYSBzbGltIHRvb2xiYXIgYWJvdmUgdGhlIEJyb3dzZXJWaWV3IGFyZWEgKi9cblx0cHJpdmF0ZSBidWlsZEJyb3dzZXJDaHJvbWUoKTogdm9pZCB7XG5cdFx0Y29uc3QgdG9vbGJhciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJ3di10b29sYmFyXCIgfSk7XG5cdFx0dG9vbGJhci5zdHlsZS5jc3NUZXh0ID0gYFxuXHRcdFx0ZGlzcGxheTogZmxleDtcblx0XHRcdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdFx0XHRnYXA6IDZweDtcblx0XHRcdHBhZGRpbmc6IDZweCA4cHg7XG5cdFx0XHRib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuXHRcdFx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRcdFx0ZmxleC1zaHJpbms6IDA7XG5cdFx0YDtcblxuXHRcdGNvbnN0IGJhY2tCdG4gPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCLihpBcIiB9KTtcblx0XHRjb25zdCBmb3J3YXJkQnRuID0gdG9vbGJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwi4oaSXCIgfSk7XG5cdFx0Y29uc3QgcmVmcmVzaEJ0biA9IHRvb2xiYXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIuKGulwiIH0pO1xuXG5cdFx0Y29uc3QgdXJsQmFyID0gdG9vbGJhci5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIgfSk7XG5cdFx0dXJsQmFyLnZhbHVlID0gdGhpcy51cmw7XG5cdFx0dXJsQmFyLnN0eWxlLmNzc1RleHQgPSBgZmxleDogMTsgZm9udC1zaXplOiAxMnB4O2A7XG5cblx0XHRjb25zdCBleHRlcm5hbEJ0biA9IHRvb2xiYXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIuKGlyBPcGVuIGluIEJyb3dzZXJcIiB9KTtcblxuXHRcdHRoaXMuY2hyb21lID0geyB1cmxCYXIsIGJhY2tCdG4sIGZvcndhcmRCdG4sIHJlZnJlc2hCdG4sIGV4dGVybmFsQnRuIH07XG5cdFx0dGhpcy5iaW5kQ2hyb21lRXZlbnRzKCk7XG5cdH1cblxuXHQvLyAtLS0gQnJvd3NlclZpZXcgLS0tXG5cblx0LyoqIEF0dGFjaCBhIHJlYWwgRWxlY3Ryb24gQnJvd3NlclZpZXcgdG8gdGhlIGN1cnJlbnQgT1Mgd2luZG93ICovXG5cdHByaXZhdGUgbW91bnRCcm93c2VyVmlldygpOiB2b2lkIHtcblx0XHRjb25zdCB3aW4gPSByZW1vdGUuZ2V0Q3VycmVudFdpbmRvdygpO1xuXG5cdFx0Y29uc3QgdmlldyA9IG5ldyByZW1vdGUuQnJvd3NlclZpZXcoe1xuXHRcdFx0d2ViUHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0bm9kZUludGVncmF0aW9uOiBmYWxzZSxcblx0XHRcdFx0Y29udGV4dElzb2xhdGlvbjogdHJ1ZSxcblx0XHRcdFx0c2FuZGJveDogdHJ1ZSxcblx0XHRcdH0sXG5cdFx0fSk7XG5cblx0XHR3aW4uYWRkQnJvd3NlclZpZXcodmlldyk7XG5cdFx0dGhpcy5icm93c2VyVmlldyA9IHZpZXc7XG5cblx0XHQvLyBTeW5jIFVSTCBiYXIgYW5kIG5hdiBidXR0b24gc3RhdGUgYXMgcGFnZSBuYXZpZ2F0ZXNcblx0XHR2aWV3LndlYkNvbnRlbnRzLm9uKFwiZGlkLW5hdmlnYXRlXCIsIChfOiB1bmtub3duLCB1cmw6IHN0cmluZykgPT4ge1xuXHRcdFx0dGhpcy51cmwgPSB1cmw7XG5cdFx0XHRpZiAodGhpcy5jaHJvbWUpIHRoaXMuY2hyb21lLnVybEJhci52YWx1ZSA9IHVybDtcblx0XHRcdHRoaXMudXBkYXRlTmF2QnV0dG9ucygpO1xuXHRcdH0pO1xuXG5cdFx0dmlldy53ZWJDb250ZW50cy5vbihcImRpZC1uYXZpZ2F0ZS1pbi1wYWdlXCIsIChfOiB1bmtub3duLCB1cmw6IHN0cmluZykgPT4ge1xuXHRcdFx0dGhpcy51cmwgPSB1cmw7XG5cdFx0XHRpZiAodGhpcy5jaHJvbWUpIHRoaXMuY2hyb21lLnVybEJhci52YWx1ZSA9IHVybDtcblx0XHR9KTtcblxuXHRcdHZpZXcud2ViQ29udGVudHMubG9hZFVSTCh0aGlzLnVybCk7XG5cblx0XHQvLyBEZWZlciBib3VuZHMgc3luYyB1bnRpbCBET00gaGFzIHBhaW50ZWRcblx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gdGhpcy5zeW5jQm91bmRzKCkpO1xuXHR9XG5cblx0LyoqIERlc3Ryb3kgdGhlIEJyb3dzZXJWaWV3IGFuZCByZW1vdmUgaXQgZnJvbSB0aGUgT1Mgd2luZG93ICovXG5cdHByaXZhdGUgdGVhcmRvd25Ccm93c2VyVmlldygpOiB2b2lkIHtcblx0XHRpZiAoIXRoaXMuYnJvd3NlclZpZXcpIHJldHVybjtcblx0XHRjb25zdCB3aW4gPSByZW1vdGUuZ2V0Q3VycmVudFdpbmRvdygpO1xuXHRcdHdpbi5yZW1vdmVCcm93c2VyVmlldyh0aGlzLmJyb3dzZXJWaWV3KTtcblx0XHQvLyBkZXN0cm95KCkgZXhpc3RzIGF0IHJ1bnRpbWUgYnV0IG1heSBiZSBtaXNzaW5nIGZyb20gdHlwZSBkZWZpbml0aW9uc1xuXHRcdCh0aGlzLmJyb3dzZXJWaWV3LndlYkNvbnRlbnRzIGFzIGFueSkuZGVzdHJveSgpO1xuXHRcdHRoaXMuYnJvd3NlclZpZXcgPSBudWxsO1xuXHR9XG5cblx0Ly8gLS0tIEJvdW5kcyBTeW5jaW5nIC0tLVxuXG5cdC8qKlxuXHQgKiBCcm93c2VyVmlldyBpcyBwYWludGVkIG9uIHRoZSBPUyB3aW5kb3cgc3VyZmFjZSwgb3V0c2lkZSB0aGUgRE9NLlxuXHQgKiBXZSBoYXZlIHRvIG1hbnVhbGx5IHBvc2l0aW9uIGl0IHRvIHNpdCBiZWxvdyB0aGUgY2hyb21lIHRvb2xiYXIuXG5cdCAqIEVsZWN0cm9uJ3Mgc2V0Qm91bmRzIHVzZXMgbG9naWNhbCBwaXhlbHMg4oCUIG5vIERQUiBzY2FsaW5nIG5lZWRlZC5cblx0ICovXG5cdHByaXZhdGUgc3luY0JvdW5kcygpOiB2b2lkIHtcblx0XHRpZiAoIXRoaXMuYnJvd3NlclZpZXcpIHJldHVybjtcblxuXHRcdGNvbnN0IHRvb2xiYXIgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFwiLnd2LXRvb2xiYXJcIik7XG5cdFx0Y29uc3QgdG9vbGJhckhlaWdodCA9IHRvb2xiYXI/LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCA/PyA0MDtcblx0XHRjb25zdCBtb2RhbFJlY3QgPSB0aGlzLm1vZGFsRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0Y29uc3QgcGFkID0gcGFyc2VGbG9hdChnZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkuZm9udFNpemUpOyAvLyAxcmVtIGluIHB4XG5cblx0XHQvLyBzZXRCb3VuZHMgdXNlcyBsb2dpY2FsIHBpeGVscyDigJQgZG8gTk9UIG11bHRpcGx5IGJ5IGRldmljZVBpeGVsUmF0aW9cblx0XHR0aGlzLmJyb3dzZXJWaWV3LnNldEJvdW5kcyh7XG5cdFx0XHR4OiBNYXRoLnJvdW5kKG1vZGFsUmVjdC5sZWZ0ICsgcGFkKSxcblx0XHRcdHk6IE1hdGgucm91bmQobW9kYWxSZWN0LnRvcCArIHRvb2xiYXJIZWlnaHQgKyBwYWQpLFxuXHRcdFx0d2lkdGg6IE1hdGgucm91bmQobW9kYWxSZWN0LndpZHRoIC0gcGFkICogMiksXG5cdFx0XHRoZWlnaHQ6IE1hdGgucm91bmQobW9kYWxSZWN0LmhlaWdodCAtIHRvb2xiYXJIZWlnaHQgLSBwYWQgKiAyKSxcblx0XHR9KTtcblx0fVxuXG5cdC8qKiBXYXRjaCBmb3IgbW9kYWwgcmVzaXplIChlLmcuIHdpbmRvdyByZXNpemUpIGFuZCByZS1zeW5jIGJvdW5kcyAqL1xuXHRwcml2YXRlIG9ic2VydmVSZXNpemUoKTogdm9pZCB7XG5cdFx0dGhpcy5yZXNpemVPYnNlcnZlciA9IG5ldyBSZXNpemVPYnNlcnZlcigoKSA9PiB0aGlzLnN5bmNCb3VuZHMoKSk7XG5cdFx0dGhpcy5yZXNpemVPYnNlcnZlci5vYnNlcnZlKHRoaXMubW9kYWxFbCk7XG5cdH1cblxuXHQvLyAtLS0gQ2hyb21lIEV2ZW50IEJpbmRpbmcgLS0tXG5cblx0cHJpdmF0ZSBiaW5kQ2hyb21lRXZlbnRzKCk6IHZvaWQge1xuXHRcdGlmICghdGhpcy5jaHJvbWUpIHJldHVybjtcblx0XHRjb25zdCB7IGJhY2tCdG4sIGZvcndhcmRCdG4sIHJlZnJlc2hCdG4sIHVybEJhciwgZXh0ZXJuYWxCdG4gfSA9IHRoaXMuY2hyb21lO1xuXG5cdFx0YmFja0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuXHRcdFx0dGhpcy5icm93c2VyVmlldz8ud2ViQ29udGVudHMuZ29CYWNrKCk7XG5cdFx0fSk7XG5cblx0XHRmb3J3YXJkQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG5cdFx0XHR0aGlzLmJyb3dzZXJWaWV3Py53ZWJDb250ZW50cy5nb0ZvcndhcmQoKTtcblx0XHR9KTtcblxuXHRcdHJlZnJlc2hCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcblx0XHRcdHRoaXMuYnJvd3NlclZpZXc/LndlYkNvbnRlbnRzLnJlbG9hZCgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gTmF2aWdhdGUgb24gRW50ZXIgaW4gVVJMIGJhclxuXHRcdHVybEJhci5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZSkgPT4ge1xuXHRcdFx0aWYgKGUua2V5ICE9PSBcIkVudGVyXCIpIHJldHVybjtcblx0XHRcdGNvbnN0IHJhdyA9IHVybEJhci52YWx1ZS50cmltKCk7XG5cdFx0XHRjb25zdCB1cmwgPSByYXcuc3RhcnRzV2l0aChcImh0dHBcIikgPyByYXcgOiBgaHR0cHM6Ly8ke3Jhd31gO1xuXHRcdFx0dGhpcy5icm93c2VyVmlldz8ud2ViQ29udGVudHMubG9hZFVSTCh1cmwpO1xuXHRcdH0pO1xuXG5cdFx0ZXh0ZXJuYWxCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcblx0XHRcdC8vIFVzZSBPYnNpZGlhbidzIHNoZWxsIG9wZW4g4oCUIHJlc3BlY3RzIHVzZXIncyBkZWZhdWx0IGJyb3dzZXJcblx0XHRcdCh3aW5kb3cgYXMgYW55KS5yZXF1aXJlKFwiZWxlY3Ryb25cIikuc2hlbGwub3BlbkV4dGVybmFsKHRoaXMudXJsKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKiBFbmFibGUvZGlzYWJsZSBiYWNrIGFuZCBmb3J3YXJkIGJ1dHRvbnMgYmFzZWQgb24gbmF2aWdhdGlvbiBoaXN0b3J5ICovXG5cdHByaXZhdGUgdXBkYXRlTmF2QnV0dG9ucygpOiB2b2lkIHtcblx0XHRpZiAoIXRoaXMuY2hyb21lIHx8ICF0aGlzLmJyb3dzZXJWaWV3KSByZXR1cm47XG5cdFx0dGhpcy5jaHJvbWUuYmFja0J0bi5kaXNhYmxlZCA9ICF0aGlzLmJyb3dzZXJWaWV3LndlYkNvbnRlbnRzLmNhbkdvQmFjaygpO1xuXHRcdHRoaXMuY2hyb21lLmZvcndhcmRCdG4uZGlzYWJsZWQgPSAhdGhpcy5icm93c2VyVmlldy53ZWJDb250ZW50cy5jYW5Hb0ZvcndhcmQoKTtcblx0fVxufVxuIl19