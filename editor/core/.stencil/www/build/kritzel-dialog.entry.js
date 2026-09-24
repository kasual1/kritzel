import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';
import { F as KritzelHTMLHelper } from './index-BEzQin2J.js';
import './yjs-CvNgPRai.js';

const kritzelDialogCss = () => `:host{display:contents}.dialog-content{text-align:start;line-height:normal}.backdrop{position:fixed;top:0;left:0;right:0;bottom:0;z-index:10002;display:flex;align-items:center;justify-content:center;background-color:var(--kritzel-dialog-backdrop-color, rgba(0, 0, 0, 0.5));opacity:1;transition:opacity 150ms ease-out}.backdrop.is-animating{opacity:0}.dialog-content{position:relative;display:flex;flex-direction:column;background-color:var(--kritzel-dialog-background-color, #ffffff);border-radius:var(--kritzel-dialog-border-radius, 12px);box-shadow:var(--kritzel-dialog-box-shadow, 0 4px 20px rgba(0, 0, 0, 0.15));border:var(--kritzel-dialog-border, 1px solid #ebebeb);max-height:var(--kritzel-dialog-max-height, 90vh);max-width:var(--kritzel-dialog-max-width, 90vw);overflow:hidden;transform:scale(1);opacity:1;transition:transform 200ms ease-out,      opacity 200ms ease-out;font-family:var(--kritzel-dialog-font-family, var(--kritzel-global-font-family, sans-serif))}.dialog-content.is-animating{transform:scale(0.95);opacity:0}.dialog-content.size-small{width:var(--kritzel-dialog-width-small, 320px);height:var(--kritzel-dialog-height-small, auto)}.dialog-content.size-medium{width:var(--kritzel-dialog-width-medium, 480px);height:var(--kritzel-dialog-height-medium, auto)}.dialog-content.size-large{width:var(--kritzel-dialog-width-large, 640px);height:var(--kritzel-dialog-height-large, auto)}.dialog-content.size-fullscreen{width:100vw;height:100vh;height:100dvh;max-width:100vw;max-height:100vh;max-height:100dvh;border-radius:0}.backdrop.contained-fullscreen{background-color:transparent}.dialog-content.contained-fullscreen{border-radius:0}.dialog-content.contained-fullscreen .dialog-body{display:flex;flex-direction:column}.dialog-content.contained-fullscreen .dialog-body ::slotted(*){flex:1;min-height:0}@media (max-width: 576px), (max-height: 576px) and (orientation: landscape){.backdrop:has(.fullscreen-on-mobile){background-color:transparent}.dialog-content.fullscreen-on-mobile{width:100vw;height:100vh;height:100dvh;max-width:100vw;max-height:100vh;max-height:100dvh;border-radius:0}.dialog-content.fullscreen-on-mobile .dialog-body{display:flex;flex-direction:column}.dialog-content.fullscreen-on-mobile .dialog-body ::slotted(*){flex:1;min-height:0}}.dialog-header{display:flex;align-items:center;justify-content:space-between;padding:var(--kritzel-dialog-header-padding, 16px 20px);border-bottom:var(--kritzel-dialog-header-border, 1px solid #ebebeb);gap:12px}.dialog-title{margin:0;font-size:var(--kritzel-dialog-title-font-size, 18px);font-weight:var(--kritzel-dialog-title-font-weight, 600);color:var(--kritzel-dialog-title-color, #1a1a1a);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.close-button{display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:none;border-radius:var(--kritzel-dialog-close-button-border-radius, 6px);background-color:var(--kritzel-dialog-close-button-background, transparent);color:var(--kritzel-dialog-close-button-color, #666666);cursor:var(--kritzel-global-pointer-cursor, pointer);transition:background-color 150ms ease,      color 150ms ease;flex-shrink:0;-webkit-tap-highlight-color:transparent}.close-button:hover{background-color:var(--kritzel-dialog-close-button-hover-background, #f5f5f5);color:var(--kritzel-dialog-close-button-hover-color, #1a1a1a)}.close-button:active{background-color:var(--kritzel-dialog-close-button-active-background, #ebebeb)}.close-button:focus-visible{outline:revert;outline-offset:revert}.dialog-body{padding:var(--kritzel-dialog-body-padding, 20px);overflow-y:auto;flex:1;min-height:0;scrollbar-color:var(--kritzel-global-scrollbar-thumb-color, #ebebeb) transparent;scrollbar-width:thin}.dialog-footer{display:flex;align-items:center;justify-content:flex-end;gap:var(--kritzel-dialog-footer-gap, 8px);padding:var(--kritzel-dialog-footer-padding, 16px 20px);border-top:var(--kritzel-dialog-footer-border, 1px solid #ebebeb)}::slotted([slot='header']){flex:1}::slotted([slot='footer']){display:contents}`;

const KritzelDialog = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.dialogOpen = createEvent(this, "dialogOpen", 7);
        this.dialogClose = createEvent(this, "dialogClose", 7);
    }
    get host() { return getElement(this); }
    /** Whether the dialog is open */
    isOpen = false;
    /** Optional title displayed in the header */
    dialogTitle;
    /** Whether to show the close button in the header */
    closable = true;
    /** Whether clicking the backdrop closes the dialog */
    closeOnBackdrop = true;
    /** Whether pressing Escape closes the dialog */
    closeOnEscape = true;
    /** Whether to auto-focus the first focusable element when opened */
    autoFocus = true;
    /** Whether to trap focus within the dialog */
    trapFocus = true;
    /** Size of the dialog */
    size = 'medium';
    /** Whether to automatically go fullscreen on mobile viewports */
    fullscreenOnMobile = true;
    /** Constrain the dialog to its nearest editor/container ancestor instead of the viewport. */
    contained = false;
    isAnimating = false;
    mobileLockedHeight = null;
    containerRect = null;
    containerBorderRadius = null;
    /** Emitted when the dialog opens */
    dialogOpen;
    /** Emitted when the dialog closes */
    dialogClose;
    previousOverflow = '';
    previousActiveElement = null;
    visualViewportListenersAttached = false;
    containerElement = null;
    containerResizeObserver = null;
    containerTrackingFrame = null;
    handleIsOpenChange(newValue) {
        if (newValue) {
            this.openDialog();
        }
        else {
            this.closeDialog();
        }
    }
    handleKeyDown(event) {
        if (!this.isOpen)
            return;
        if (event.key === 'Escape' && this.closeOnEscape) {
            event.preventDefault();
            event.stopPropagation();
            this.emitClose('escape');
        }
        if (event.key === 'Tab' && this.trapFocus) {
            this.handleTabKey(event);
        }
    }
    handleWindowResize() {
        if (!this.isOpen)
            return;
        this.lockMobileViewportHeight();
    }
    handleOrientationChange() {
        if (!this.isOpen)
            return;
        // Let viewport metrics settle before recalculating after orientation flips.
        requestAnimationFrame(() => this.lockMobileViewportHeight());
    }
    async open() {
        if (!this.isOpen) {
            this.isOpen = true;
        }
    }
    async close(reason = 'programmatic') {
        this.emitClose(reason);
    }
    async focusFirstElement() {
        this.focusFirst();
    }
    componentDidLoad() {
        if (this.isOpen) {
            this.openDialog();
        }
    }
    disconnectedCallback() {
        this.removeVisualViewportListeners();
        this.stopContainerTracking();
        this.restoreBodyScroll();
    }
    openDialog() {
        this.isAnimating = true;
        this.previousActiveElement = document.activeElement;
        if (this.contained) {
            this.startContainerTracking();
        }
        else {
            this.lockBodyScroll();
            this.addVisualViewportListeners();
        }
        this.lockMobileViewportHeight();
        this.dialogOpen.emit();
        if (this.autoFocus) {
            requestAnimationFrame(() => {
                this.focusFirst();
            });
        }
        requestAnimationFrame(() => {
            this.isAnimating = false;
        });
    }
    closeDialog() {
        this.restoreBodyScroll();
        this.removeVisualViewportListeners();
        this.stopContainerTracking();
        this.mobileLockedHeight = null;
        this.returnFocusToPreviousElement();
    }
    findContainerElement() {
        // Walk up the composed DOM (crossing shadow roots) and return the first
        // ancestor that opts into containing dialogs. We accept either an explicit
        // [data-kritzel-dialog-container] marker or the kritzel-editor host so any
        // consumer can opt in without modifying the editor itself.
        let node = this.host;
        while (node) {
            if (node instanceof HTMLElement) {
                if (node.hasAttribute('data-kritzel-dialog-container') || node.tagName === 'KRITZEL-EDITOR') {
                    return node;
                }
            }
            const parent = node.parentNode;
            if (parent) {
                node = parent;
            }
            else if (node instanceof ShadowRoot) {
                node = node.host;
            }
            else {
                node = null;
            }
        }
        return null;
    }
    startContainerTracking() {
        this.containerElement = this.findContainerElement();
        if (!this.containerElement) {
            // No container found â€” fall back to viewport behavior.
            this.containerRect = null;
            return;
        }
        this.updateContainerRect();
        if (typeof ResizeObserver !== 'undefined') {
            this.containerResizeObserver = new ResizeObserver(() => this.updateContainerRect());
            this.containerResizeObserver.observe(this.containerElement);
        }
        window.addEventListener('resize', this.handleContainerTrackingEvent, { passive: true });
        window.addEventListener('scroll', this.handleContainerTrackingEvent, { capture: true, passive: true });
    }
    stopContainerTracking() {
        if (this.containerResizeObserver) {
            this.containerResizeObserver.disconnect();
            this.containerResizeObserver = null;
        }
        window.removeEventListener('resize', this.handleContainerTrackingEvent);
        window.removeEventListener('scroll', this.handleContainerTrackingEvent, { capture: true });
        if (this.containerTrackingFrame !== null) {
            cancelAnimationFrame(this.containerTrackingFrame);
            this.containerTrackingFrame = null;
        }
        this.containerElement = null;
        this.containerRect = null;
        this.containerBorderRadius = null;
    }
    handleContainerTrackingEvent = () => {
        if (this.containerTrackingFrame !== null)
            return;
        this.containerTrackingFrame = requestAnimationFrame(() => {
            this.containerTrackingFrame = null;
            this.updateContainerRect();
        });
    };
    updateContainerRect() {
        if (!this.containerElement)
            return;
        const rect = this.containerElement.getBoundingClientRect();
        const next = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
        const prev = this.containerRect;
        if (!prev || prev.top !== next.top || prev.left !== next.left || prev.width !== next.width || prev.height !== next.height) {
            this.containerRect = next;
        }
        // Look for the nearest visually-rounded ancestor (the container itself or
        // any ancestor up to the document) so the backdrop matches wrappers that
        // round their corners around the editor.
        const radius = this.findVisualBorderRadius(this.containerElement);
        if (this.containerBorderRadius !== radius) {
            this.containerBorderRadius = radius;
        }
    }
    findVisualBorderRadius(start) {
        let node = start;
        while (node && node !== document.body && node !== document.documentElement) {
            const computed = window.getComputedStyle(node);
            const tl = computed.borderTopLeftRadius;
            const tr = computed.borderTopRightRadius;
            const br = computed.borderBottomRightRadius;
            const bl = computed.borderBottomLeftRadius;
            const isZero = (v) => !v || v === '0px' || v === '0%';
            if (!(isZero(tl) && isZero(tr) && isZero(br) && isZero(bl))) {
                return `${tl} ${tr} ${br} ${bl}`;
            }
            node = node.parentElement;
        }
        return null;
    }
    emitClose(reason) {
        this.dialogClose.emit({ reason });
    }
    lockBodyScroll() {
        this.previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }
    lockMobileViewportHeight() {
        // Skip mobile viewport height locking when contained â€” the dialog is sized
        // by its wrapper, not the viewport.
        if (this.contained) {
            this.mobileLockedHeight = null;
            return;
        }
        // Only lock height on mobile when fullscreenOnMobile is enabled.
        // Use the smaller dimension so landscape phones (wide but short) are also detected.
        const viewportWidth = this.getViewportWidth();
        const viewportHeight = this.getViewportHeight();
        if (!this.fullscreenOnMobile || Math.min(viewportWidth, viewportHeight) > 576) {
            this.mobileLockedHeight = null;
            return;
        }
        this.mobileLockedHeight = `${viewportHeight}px`;
    }
    getViewportWidth() {
        return Math.round(window.visualViewport?.width ?? window.innerWidth);
    }
    getViewportHeight() {
        return Math.round(window.visualViewport?.height ?? window.innerHeight);
    }
    addVisualViewportListeners() {
        const viewport = window.visualViewport;
        if (!viewport || this.visualViewportListenersAttached)
            return;
        viewport.addEventListener('resize', this.handleVisualViewportChange);
        viewport.addEventListener('scroll', this.handleVisualViewportChange);
        this.visualViewportListenersAttached = true;
    }
    removeVisualViewportListeners() {
        const viewport = window.visualViewport;
        if (!viewport || !this.visualViewportListenersAttached)
            return;
        viewport.removeEventListener('resize', this.handleVisualViewportChange);
        viewport.removeEventListener('scroll', this.handleVisualViewportChange);
        this.visualViewportListenersAttached = false;
    }
    handleVisualViewportChange = () => {
        if (!this.isOpen)
            return;
        this.lockMobileViewportHeight();
    };
    restoreBodyScroll() {
        document.body.style.overflow = this.previousOverflow;
    }
    returnFocusToPreviousElement() {
        if (this.previousActiveElement?.focus) {
            this.previousActiveElement.focus();
        }
    }
    focusFirst() {
        const dialogContent = this.host.shadowRoot?.querySelector('.dialog-content');
        if (!dialogContent)
            return;
        const focusableElements = KritzelHTMLHelper.getFocusableElements(dialogContent);
        const slotElements = this.getSlottedFocusableElements();
        const allFocusable = [...focusableElements, ...slotElements];
        if (allFocusable.length > 0) {
            allFocusable[0].focus();
        }
        else {
            dialogContent.focus();
        }
    }
    getSlottedFocusableElements() {
        const slots = this.host.shadowRoot?.querySelectorAll('slot') ?? [];
        const focusable = [];
        slots.forEach(slot => {
            const assigned = slot.assignedElements({ flatten: true });
            assigned.forEach(el => {
                // Use KritzelHTMLHelper to find focusable elements including those in nested shadow DOMs
                const elements = KritzelHTMLHelper.getFocusableElements(el);
                focusable.push(...elements);
            });
        });
        return focusable;
    }
    handleTabKey(event) {
        const focusableElements = this.getSlottedFocusableElements();
        const closeButton = this.host.shadowRoot?.querySelector('.close-button');
        if (closeButton && this.closable) {
            focusableElements.unshift(closeButton);
        }
        if (focusableElements.length === 0)
            return;
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        const activeElement = this.getDeepActiveElement();
        if (event.shiftKey) {
            if (activeElement === firstFocusable) {
                event.preventDefault();
                lastFocusable.focus();
            }
        }
        else {
            if (activeElement === lastFocusable) {
                event.preventDefault();
                firstFocusable.focus();
            }
        }
    }
    getDeepActiveElement() {
        let activeEl = document.activeElement;
        while (activeEl?.shadowRoot?.activeElement) {
            activeEl = activeEl.shadowRoot.activeElement;
        }
        return activeEl;
    }
    handleBackdropClick = (event) => {
        event.stopPropagation();
        if (this.closeOnBackdrop) {
            this.emitClose('backdrop');
        }
    };
    handleCloseButtonClick = (event) => {
        event.stopPropagation();
        this.emitClose('close-button');
    };
    handleContentClick = (event) => {
        event.stopPropagation();
    };
    renderCloseButton() {
        if (!this.closable)
            return null;
        return (h("button", { class: "close-button", type: "button", "aria-label": "Close dialog", onClick: this.handleCloseButtonClick }, h("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }, h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }))));
    }
    renderHeader() {
        const hasHeaderSlot = this.host.querySelector('[slot="header"]') !== null;
        const hasTitle = !!this.dialogTitle;
        if (!hasHeaderSlot && !hasTitle && !this.closable)
            return null;
        return (h("div", { class: "dialog-header" }, hasHeaderSlot ? (h("slot", { name: "header" })) : hasTitle ? (h("h2", { class: "dialog-title" }, this.dialogTitle)) : null, this.renderCloseButton()));
    }
    renderFooter() {
        const hasFooterSlot = this.host.querySelector('[slot="footer"]') !== null;
        if (!hasFooterSlot)
            return null;
        return (h("div", { class: "dialog-footer" }, h("slot", { name: "footer" })));
    }
    getBackdropStyle() {
        if (!this.contained || !this.containerRect)
            return undefined;
        const { top, left, width, height } = this.containerRect;
        const style = {
            top: `${top}px`,
            left: `${left}px`,
            right: 'auto',
            bottom: 'auto',
            width: `${width}px`,
            height: `${height}px`,
        };
        if (this.containerBorderRadius) {
            style.borderRadius = this.containerBorderRadius;
            // Ensure rounded corners actually clip the inner dialog content.
            style.overflow = 'hidden';
        }
        return style;
    }
    getDialogContentStyle() {
        const style = {};
        // In contained mode, cap the dialog dimensions to the container so the
        // declared widths/heights of size variants cannot overflow the wrapper.
        if (this.contained && this.containerRect) {
            const { width, height } = this.containerRect;
            if (this.isContainerMobile()) {
                // Mobile-sized container: behave like fullscreen-on-mobile but scoped
                // to the container instead of the viewport (works in any orientation).
                style.width = `${width}px`;
                style.height = `${height}px`;
                style.maxWidth = `${width}px`;
                style.maxHeight = `${height}px`;
                style.borderRadius = '0';
            }
            else {
                // Leave a small margin so the dialog visibly sits within the container.
                const maxWidth = Math.max(0, width - 32);
                const maxHeight = Math.max(0, height - 32);
                style.maxWidth = `${maxWidth}px`;
                style.maxHeight = `${maxHeight}px`;
            }
        }
        if (this.mobileLockedHeight) {
            style.height = this.mobileLockedHeight;
            style.maxHeight = this.mobileLockedHeight;
        }
        return Object.keys(style).length > 0 ? style : undefined;
    }
    isContainerMobile() {
        if (!this.fullscreenOnMobile || !this.containerRect)
            return false;
        // Match the existing viewport media-query threshold: container is "mobile"
        // when its smaller dimension is <= 576px. This handles both portrait and
        // landscape wrappers symmetrically.
        return Math.min(this.containerRect.width, this.containerRect.height) <= 576;
    }
    render() {
        if (!this.isOpen)
            return null;
        const containerFullscreen = this.contained && this.isContainerMobile();
        return (h(Host, null, h("div", { class: { backdrop: true, 'is-animating': this.isAnimating, 'contained-fullscreen': containerFullscreen }, style: this.getBackdropStyle(), onClick: this.handleBackdropClick }, h("div", { class: {
                'dialog-content': true,
                'is-animating': this.isAnimating,
                [`size-${this.size}`]: true,
                'fullscreen-on-mobile': this.fullscreenOnMobile,
                'contained-fullscreen': containerFullscreen,
            }, style: this.getDialogContentStyle(), role: "dialog", "aria-modal": "true", "aria-labelledby": this.dialogTitle ? 'dialog-title' : undefined, tabIndex: -1, onClick: this.handleContentClick }, this.renderHeader(), h("div", { class: "dialog-body" }, h("slot", null)), this.renderFooter()))));
    }
    static get watchers() { return {
        "isOpen": [{
                "handleIsOpenChange": 0
            }]
    }; }
};
KritzelDialog.style = kritzelDialogCss();

export { KritzelDialog as kritzel_dialog };
//# sourceMappingURL=kritzel-dialog.entry.esm.js.map

//# sourceMappingURL=kritzel-dialog.entry.js.map