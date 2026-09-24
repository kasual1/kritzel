import { r as registerInstance, h, d as Host } from './index-BDyeD8t8.js';
import { K as KRITZEL_WEBSITE_URL } from './engine.constants-BeIX0JEY.js';

const kritzelWatermarkCss = () => `:host{position:absolute;bottom:var(--kritzel-watermark-offset-bottom, 12px);right:var(--kritzel-watermark-offset-right, 12px);z-index:10000;pointer-events:none}.watermark-link{pointer-events:auto;display:inline-flex;align-items:center;padding:4px 8px;border-radius:var(--kritzel-watermark-border-radius, 6px);font-family:var(--kritzel-global-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);font-size:var(--kritzel-watermark-font-size, 11px);line-height:1;text-decoration:none;color:var(--kritzel-watermark-color, rgba(60, 60, 60, 0.75));background-color:var(--kritzel-watermark-background, rgba(255, 255, 255, 0.6));box-shadow:var(--kritzel-watermark-box-shadow, 0 1px 2px rgba(0, 0, 0, 0.12));opacity:var(--kritzel-watermark-opacity, 0.85);transition:opacity 150ms ease;user-select:none}.watermark-link:hover{opacity:1}`;

const KritzelWatermark = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
    }
    /** The core instance used to resolve localized terms. */
    core;
    /**
     * Resolved "Powered by Kritzel" label. Passed in by the engine so the badge
     * re-renders when the active locale changes. Falls back to resolving the term
     * from the core when not provided.
     */
    label;
    render() {
        const label = this.label ?? this.core.localizationManager.translate('watermark.poweredBy');
        return (h(Host, { key: '5bc76650ecd1f82f5ed283d4433b0e5fc8937cab' }, h("a", { key: 'b0828f36df618e461794772d2e8f55c0a8cb357e', class: "watermark-link", href: KRITZEL_WEBSITE_URL, target: "_blank", rel: "noopener noreferrer", part: "watermark", onPointerDown: (ev) => ev.stopPropagation(), onPointerUp: (ev) => ev.stopPropagation() }, label)));
    }
};
KritzelWatermark.style = kritzelWatermarkCss();

export { KritzelWatermark as kritzel_watermark };
//# sourceMappingURL=kritzel-watermark.entry.esm.js.map

//# sourceMappingURL=kritzel-watermark.entry.js.map