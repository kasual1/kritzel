import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';
import { F as KritzelHTMLHelper } from './index-BEzQin2J.js';
import './yjs-CvNgPRai.js';

const kritzelTooltipCss = () => `:host{width:auto}.tooltip-content{position:relative;padding:8px 12px;border-radius:4px;width:fit-content;background-color:var(--kritzel-tooltip-background-color, #ffffff);color:var(--kritzel-tooltip-color, #000000);padding:var(--kritzel-tooltip-padding, 12px);border:var(--kritzel-tooltip-border, 1px solid #ebebeb);border-radius:var(--kritzel-tooltip-border-radius, 16px);white-space:nowrap;box-shadow:var(--kritzel-tooltip-box-shadow, 0 1px 6px rgba(0, 0, 0, 0.12))}`;

const KritzelTooltip = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.tooltipClosed = createEvent(this, "tooltipClosed", 7);
        this.tooltipOpened = createEvent(this, "tooltipOpened", 7);
    }
    get host() { return getElement(this); }
    isVisible = false;
    anchorElement;
    triggerElement;
    offsetY = 24;
    tooltipClosed;
    tooltipOpened;
    positionX = 0;
    positionY = 0;
    handleOutsideClick(event) {
        if (!this.isVisible)
            return;
        const path = event.composedPath();
        const isInsideTooltip = path.some(el => el === this.host);
        const isOnTrigger = this.triggerElement && path.some(el => el === this.triggerElement);
        if (!isInsideTooltip && !isOnTrigger) {
            this.close();
        }
    }
    handleOutsidePointerDown(event) {
        if (!this.isVisible)
            return;
        const path = event.composedPath();
        const isInsideTooltip = path.some(el => el === this.host);
        const isOnTrigger = this.triggerElement && path.some(el => el === this.triggerElement);
        if (!isInsideTooltip && !isOnTrigger) {
            event.stopPropagation();
            event.preventDefault();
            this.close();
        }
    }
    handleCloseAll(event) {
        if (event.detail !== this.host) {
            this.close();
        }
    }
    handleWindowResize() {
        this.calculateAdjustedPosition();
    }
    handleTriggerElementChange(newTrigger, oldTrigger) {
        if (oldTrigger) {
            oldTrigger.removeEventListener('click', this.handleTriggerClick);
        }
        if (newTrigger) {
            newTrigger.addEventListener('click', this.handleTriggerClick);
        }
    }
    handleVisibilityChange(newValue) {
        if (newValue) {
            this.calculateAdjustedPosition();
            requestAnimationFrame(() => {
                this.focusContent();
            });
        }
    }
    async open() {
        if (this.isVisible)
            return;
        document.dispatchEvent(new CustomEvent('kritzelTooltipCloseAll', { detail: this.host }));
        this.isVisible = true;
        this.tooltipOpened.emit();
    }
    async close() {
        if (!this.isVisible)
            return;
        this.isVisible = false;
        this.tooltipClosed.emit();
    }
    async toggle() {
        if (this.isVisible) {
            this.close();
        }
        else {
            this.open();
        }
    }
    async focusContent() {
        const focusableElements = KritzelHTMLHelper.getFocusableElements(this.host);
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }
    connectedCallback() {
        if (this.triggerElement) {
            this.triggerElement.addEventListener('click', this.handleTriggerClick);
        }
    }
    componentDidLoad() {
        if (this.triggerElement) {
            this.triggerElement.addEventListener('click', this.handleTriggerClick);
        }
    }
    componentWillLoad() {
        this.calculateAdjustedPosition();
    }
    componentWillUpdate() {
        this.calculateAdjustedPosition();
    }
    disconnectedCallback() {
        if (this.triggerElement) {
            this.triggerElement.removeEventListener('click', this.handleTriggerClick);
        }
    }
    handleTriggerClick = (event) => {
        event.stopPropagation();
        this.toggle();
    };
    calculateAdjustedPosition() {
        if (this.isVisible && this.anchorElement) {
            const anchorRect = this.anchorElement.getBoundingClientRect();
            const tooltipContent = this.host.shadowRoot?.querySelector('.tooltip-content');
            const tooltipRect = tooltipContent?.getBoundingClientRect();
            const tooltipWidth = tooltipRect?.width || 0;
            const viewportPadding = 12; // Minimum distance from viewport edges
            const anchorCenterX = anchorRect.left + anchorRect.width / 2;
            // Step 1: Try to center the tooltip above the anchor
            let idealLeft = anchorCenterX - tooltipWidth / 2;
            // Step 2: Clamp to viewport bounds
            const minLeft = viewportPadding;
            const maxLeft = window.innerWidth - tooltipWidth - viewportPadding;
            // Apply clamping - adjust if tooltip would overflow
            this.positionX = Math.max(minLeft, Math.min(idealLeft, maxLeft));
            // Step 3: Calculate bottom position (distance from viewport bottom to top of anchor + offset)
            this.positionY = window.innerHeight - anchorRect.top + this.offsetY;
        }
    }
    render() {
        return (h(Host, { key: 'aa1367fd2af71357855814087a3d3c69e77e326f', style: {
                position: 'fixed',
                zIndex: '9999',
                transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
                visibility: this.isVisible ? 'visible' : 'hidden',
                left: `${this.positionX}px`,
                bottom: `${this.positionY}px`,
            } }, h("div", { key: 'da84f59a18173fa4c93b4c2b8ace6102b0067e17', class: "tooltip-content", onClick: event => event.stopPropagation(), onPointerDown: event => event.stopPropagation(), onMouseDown: event => event.stopPropagation() }, h("slot", { key: 'a68910ec2f7c2243043aea21489e3c68b6b09966' }))));
    }
    static get watchers() { return {
        "triggerElement": [{
                "handleTriggerElementChange": 0
            }],
        "isVisible": [{
                "handleVisibilityChange": 0
            }]
    }; }
};
KritzelTooltip.style = kritzelTooltipCss();

export { KritzelTooltip as kritzel_tooltip };
//# sourceMappingURL=kritzel-tooltip.entry.esm.js.map

//# sourceMappingURL=kritzel-tooltip.entry.js.map