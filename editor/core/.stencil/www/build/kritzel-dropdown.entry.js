import { r as registerInstance, a as createEvent, e as getElement, h, d as Host } from './index-BDyeD8t8.js';

const kritzelDropdownCss = () => `:host{display:inline-flex;vertical-align:middle;width:100%;position:relative}.dropdown-wrapper{display:flex;align-items:center;border:1px solid var(--kritzel-dropdown-border-color, #ebebeb);border-radius:var(--kritzel-dropdown-border-radius, 6px);overflow:visible;height:38px;width:100%;position:relative}.dropdown-wrapper:hover:not(:focus-within){border-color:var(--kritzel-dropdown-hover-border-color, #cccccc)}.dropdown-container{flex:1;height:100%;min-width:0}.dropdown-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 8px;height:100%;width:100%;box-sizing:border-box;border-radius:var(--kritzel-dropdown-border-radius, 6px);border:none;background-color:var(--kritzel-dropdown-background, #ffffff);cursor:var(--kritzel-global-pointer-cursor, pointer);outline:none;font-size:inherit;font-family:inherit;color:var(--kritzel-dropdown-text-color, #333333);-webkit-tap-highlight-color:transparent;text-align:left}.dropdown-trigger:focus-visible{outline:revert}.dropdown-trigger.has-suffix-border{border-right:1px solid var(--kritzel-global-border-color, #ebebeb);border-top-right-radius:0;border-bottom-right-radius:0}.dropdown-trigger.has-prefix-border{border-left:1px solid var(--kritzel-global-border-color, #ebebeb);border-top-left-radius:0;border-bottom-left-radius:0}.dropdown-trigger-label{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}.dropdown-trigger-arrow{display:flex;align-items:center;justify-content:center;width:16px;height:16px;flex-shrink:0;transition:transform 0.2s ease}.dropdown-trigger-arrow svg{width:100%;height:100%}.dropdown-trigger.is-open .dropdown-trigger-arrow{transform:rotate(180deg)}.dropdown-trigger.is-open.open-up .dropdown-trigger-arrow{transform:rotate(0deg)}.dropdown-menu{position:absolute;left:0;right:0;margin:0;padding:4px 0;list-style:none;background-color:var(--kritzel-dropdown-background, #ffffff);border:1px solid var(--kritzel-global-border-color, #ebebeb);border-radius:var(--kritzel-dropdown-menu-border-radius, var(--kritzel-dropdown-border-radius, 6px));box-shadow:var(--kritzel-toolbar-box-shadow, 0 4px 12px rgba(0, 0, 0, 0.15));z-index:1000;max-height:240px;overflow-y:auto;opacity:0;visibility:hidden;transition:opacity 0.15s ease,      transform 0.15s ease,      visibility 0.15s;outline:none}.dropdown-menu.open-down{top:calc(100% + 4px);bottom:auto;transform:translateY(-8px)}.dropdown-menu.open-up{bottom:calc(100% + 4px);top:auto;transform:translateY(8px)}.dropdown-menu.is-open{opacity:1;visibility:inherit;transform:translateY(0)}.dropdown-menu.open-up{box-shadow:var(--kritzel-toolbar-box-shadow, 0 -4px 12px rgba(0, 0, 0, 0.15))}.dropdown-option{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;cursor:var(--kritzel-global-pointer-cursor, pointer);color:var(--kritzel-dropdown-text-color, #333333);transition:background-color 0.1s ease;-webkit-tap-highlight-color:transparent}.dropdown-option.is-focused{background-color:var(--kritzel-dropdown-hover-background-color, #f0f0f0)}.dropdown-option.is-selected{font-weight:600;background-color:var(--kritzel-dropdown-selected-background-color, #007bff1a)}.dropdown-option-check{display:flex;align-items:center;justify-content:center;width:16px;height:16px;flex-shrink:0;color:var(--kritzel-dropdown-accent-color, #007bff)}.dropdown-option-check svg{width:100%;height:100%}.dropdown-menu{scrollbar-color:var(--kritzel-global-scrollbar-thumb-color, #ebebeb) transparent;scrollbar-width:thin}::slotted(*){height:100%;box-sizing:border-box}`;

const KritzelDropdown = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.valueChanged = createEvent(this, "valueChanged", 7);
    }
    get el() { return getElement(this); }
    options = [];
    optionsChanged() {
        this.updateInternalValue(this.internalValue, true);
    }
    value;
    externalValueChanged(newValue) {
        if (newValue !== this.internalValue) {
            this.updateInternalValue(newValue, false);
        }
    }
    width;
    selectStyles = {};
    /** Force the dropdown to open in a specific direction instead of auto-detecting */
    forceOpenDirection;
    internalValue;
    hasSuffixContent = false;
    hasPrefixContent = false;
    isOpen = false;
    focusedIndex = -1;
    openDirection = 'down';
    valueChanged;
    suffixSlotElement;
    prefixSlotElement;
    triggerElement;
    menuElement;
    wrapperElement;
    componentWillLoad() {
        this.updateInternalValue(this.value, false);
        this.evaluateSuffixContent();
        this.evaluatePrefixContent();
    }
    disconnectedCallback() {
        // Close menu when component is removed from DOM to prevent orphaned open dropdowns
        if (this.isOpen) {
            this.isOpen = false;
        }
    }
    handleDocumentClick(event) {
        if (this.isOpen && !this.el.contains(event.target)) {
            this.closeMenu();
        }
    }
    handleDocumentKeydown(event) {
        if (this.isOpen && event.key === 'Escape') {
            event.stopPropagation();
            event.preventDefault();
            this.closeMenu();
            this.triggerElement?.focus();
        }
    }
    updateInternalValue(proposedValue, emitChange) {
        let finalValue = proposedValue;
        // Only fall back to an option if the proposed value is completely missing.
        // We intentionally don't sanitize invalid values here, to allow for values 
        // that might be added to options asynchronously later (preventing race conditions).
        if (!finalValue && this.options && this.options.length > 0) {
            finalValue = this.options[0].value;
        }
        else if (!finalValue) {
            finalValue = undefined;
        }
        if (this.internalValue !== finalValue) {
            this.internalValue = finalValue;
            if (emitChange || (proposedValue !== finalValue && proposedValue !== undefined)) {
                this.valueChanged.emit(this.internalValue);
            }
        }
    }
    toggleMenu = () => {
        if (this.isOpen) {
            this.closeMenu();
        }
        else {
            this.openMenu();
        }
    };
    openMenu = () => {
        this.calculateMenuDirection();
        this.isOpen = true;
        const currentIndex = this.options.findIndex(opt => opt.value === this.internalValue);
        this.focusedIndex = currentIndex >= 0 ? currentIndex : 0;
        // Focus the menu after it opens
        requestAnimationFrame(() => {
            this.menuElement?.focus();
        });
    };
    calculateMenuDirection = () => {
        if (this.forceOpenDirection) {
            this.openDirection = this.forceOpenDirection;
            return;
        }
        if (!this.wrapperElement) {
            this.openDirection = 'down';
            return;
        }
        const wrapperRect = this.wrapperElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - wrapperRect.bottom;
        const spaceAbove = wrapperRect.top;
        // Estimate menu height (max 240px or fewer based on options)
        const estimatedOptionHeight = 36; // padding + content
        const menuPadding = 8; // 4px top + 4px bottom
        const estimatedMenuHeight = Math.min(240, this.options.length * estimatedOptionHeight + menuPadding);
        // Prefer opening downward, but switch to upward if not enough space below
        // and there's more space above
        if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
            this.openDirection = 'up';
        }
        else {
            this.openDirection = 'down';
        }
    };
    closeMenu = () => {
        this.isOpen = false;
        this.focusedIndex = -1;
        // Note: openDirection is intentionally NOT reset here to allow the close animation
        // to play in the same direction the menu was opened
    };
    selectOption = (option) => {
        if (this.internalValue !== option.value) {
            this.internalValue = option.value;
            this.valueChanged.emit(this.internalValue);
        }
        this.closeMenu();
        this.triggerElement?.focus();
    };
    handleTriggerKeyDown = (event) => {
        switch (event.key) {
            case 'Enter':
            case ' ':
            case 'ArrowDown':
            case 'ArrowUp':
                event.preventDefault();
                this.openMenu();
                break;
        }
    };
    handleMenuKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.focusedIndex = Math.min(this.focusedIndex + 1, this.options.length - 1);
                this.scrollFocusedOptionIntoView();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
                this.scrollFocusedOptionIntoView();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (this.focusedIndex >= 0 && this.focusedIndex < this.options.length) {
                    this.selectOption(this.options[this.focusedIndex]);
                }
                break;
            case 'Home':
                event.preventDefault();
                this.focusedIndex = 0;
                this.scrollFocusedOptionIntoView();
                break;
            case 'End':
                event.preventDefault();
                this.focusedIndex = this.options.length - 1;
                this.scrollFocusedOptionIntoView();
                break;
            case 'Tab':
                this.closeMenu();
                break;
        }
    };
    scrollFocusedOptionIntoView = () => {
        if (!this.menuElement || this.focusedIndex < 0) {
            return;
        }
        // Use requestAnimationFrame to ensure the DOM has updated with the new focused class
        requestAnimationFrame(() => {
            const focusedOption = this.menuElement?.querySelector('.dropdown-option.is-focused');
            if (focusedOption) {
                focusedOption.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        });
    };
    handleOptionMouseEnter = (index) => {
        this.focusedIndex = index;
    };
    evaluateSuffixContent = () => {
        if (this.suffixSlotElement) {
            const newHasContent = this.suffixSlotElement.assignedNodes({ flatten: true }).length > 0;
            if (this.hasSuffixContent !== newHasContent) {
                this.hasSuffixContent = newHasContent;
            }
        }
        else if (this.hasSuffixContent !== false) {
            this.hasSuffixContent = false;
        }
    };
    evaluatePrefixContent = () => {
        if (this.prefixSlotElement) {
            const newHasContent = this.prefixSlotElement.assignedNodes({ flatten: true }).length > 0;
            if (this.hasPrefixContent !== newHasContent) {
                this.hasPrefixContent = newHasContent;
            }
        }
        else if (this.hasPrefixContent !== false) {
            this.hasPrefixContent = false;
        }
    };
    getSelectedLabel() {
        const selectedOption = this.options.find(opt => opt.value === this.internalValue);
        return selectedOption?.label ?? '';
    }
    getSelectedStyle() {
        const selectedOption = this.options.find(opt => opt.value === this.internalValue);
        return selectedOption?.style;
    }
    render() {
        const triggerClasses = {
            'dropdown-trigger': true,
            'has-suffix-border': this.hasSuffixContent,
            'has-prefix-border': this.hasPrefixContent,
            'is-open': this.isOpen,
            'open-up': this.openDirection === 'up',
        };
        const menuClasses = {
            'dropdown-menu': true,
            'is-open': this.isOpen,
            'open-up': this.openDirection === 'up',
            'open-down': this.openDirection === 'down',
        };
        return (h(Host, { key: '66ec6cbffa9fd25a7bad62d6e3477c0fe7726861' }, h("div", { key: '6dc1f20070dde95ab54f44d158659e99bd81b834', class: "dropdown-wrapper", ref: el => (this.wrapperElement = el) }, h("slot", { key: 'd9655fc7f5e6a0d74b4a1904a12cc0bf478ccf4e', name: "prefix", ref: el => (this.prefixSlotElement = el), onSlotchange: this.evaluatePrefixContent }), h("div", { key: '325af053df9588e99b493c422a1f369f0af2243a', class: "dropdown-container", style: { width: this.width } }, h("button", { key: '626d54cd8e01221b1cd61e61b9d53b534e7603db', type: "button", class: triggerClasses, style: { ...this.selectStyles, ...this.getSelectedStyle() }, onClick: this.toggleMenu, onKeyDown: this.handleTriggerKeyDown, "aria-haspopup": "listbox", "aria-expanded": this.isOpen ? 'true' : 'false', ref: el => (this.triggerElement = el) }, h("span", { key: 'bbc3ec7297ee98c1903cfd547ca20daf3a5f1311', class: "dropdown-trigger-label" }, this.getSelectedLabel()), h("span", { key: '591b71aec72d2e6eaa96e8eb4c91b1f34eb2177a', class: "dropdown-trigger-arrow", "aria-hidden": "true" }, h("svg", { key: '317034d40ceab9ca72090f6a58fc0fa5b92f2db0', xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }, h("polyline", { key: '98867959ff1d7fd5515a3fe400bdc2378013dcb9', points: "6 9 12 15 18 9" }))))), h("slot", { key: 'f9d2f73f7b233a30f57ba4a9209e1a32a8ee5e70', name: "suffix", ref: el => (this.suffixSlotElement = el), onSlotchange: this.evaluateSuffixContent }), h("ul", { key: 'f15048910c0d24855fb1e940d2adc994dee83d06', class: menuClasses, role: "listbox", tabindex: "-1", onKeyDown: this.handleMenuKeyDown, ref: el => (this.menuElement = el) }, this.options.map((option, index) => {
            const isSelected = option.value === this.internalValue;
            const isFocused = index === this.focusedIndex;
            const optionClasses = {
                'dropdown-option': true,
                'is-selected': isSelected,
                'is-focused': isFocused,
            };
            return (h("li", { class: optionClasses, role: "option", "aria-selected": isSelected ? 'true' : 'false', style: option.style, onClick: () => this.selectOption(option), onMouseEnter: () => this.handleOptionMouseEnter(index) }, option.label, isSelected && (h("span", { class: "dropdown-option-check", "aria-hidden": "true" }, h("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }, h("polyline", { points: "20 6 9 17 4 12" }))))));
        })))));
    }
    static get watchers() { return {
        "options": [{
                "optionsChanged": 0
            }],
        "value": [{
                "externalValueChanged": 0
            }]
    }; }
};
KritzelDropdown.style = kritzelDropdownCss();

export { KritzelDropdown as kritzel_dropdown };
//# sourceMappingURL=kritzel-dropdown.entry.esm.js.map

//# sourceMappingURL=kritzel-dropdown.entry.js.map