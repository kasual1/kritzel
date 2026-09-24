import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelFontFamilyCss = () => `:host{display:flex;align-items:flex-start;gap:8px;padding:0;box-sizing:border-box;width:100%}.font-style-button{display:flex;justify-content:center;align-items:center;width:42px;height:32px;padding:0;border:none;outline:none;background:none;cursor:var(--kritzel-global-pointer-cursor, pointer);border-radius:0;color:var(--control-text-color);font-weight:bold;-webkit-tap-highlight-color:transparent}.font-style-button:not(:last-child){border-right:1px solid #333333}.font-style-button:hover{background-color:var(--control-hover-bg)}.font-style-button:active{background-color:var(--control-active-bg)}.font-style-button.selected,.font-style-button.selected:hover,.font-style-button.selected:active{background-color:var(--control-selected-bg);color:var(--control-selected-color)}.font-style-button.italic-text{font-style:italic}`;

const KritzelFontFamily = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.fontFamilyChange = createEvent(this, "fontFamilyChange", 7);
    }
    fontOptions = [];
    selectedFontFamily;
    fontFamilyChange;
    handleFontOptionsChange() {
        this.ensureValidSelectedFont(this.resolveFontOptions());
    }
    componentWillLoad() {
        this.ensureValidSelectedFont(this.resolveFontOptions());
    }
    handleDropdownValueChange = (event) => {
        this.fontFamilyChange.emit(event.detail);
    };
    ensureValidSelectedFont(options) {
        if (options.length === 0) {
            return;
        }
        const normalizedSelected = this.selectedFontFamily?.trim().toLocaleLowerCase();
        const isValidCurrentFont = options.some(opt => opt.value.trim().toLocaleLowerCase() === normalizedSelected);
        if (!normalizedSelected || !isValidCurrentFont) {
            this.selectedFontFamily = options[0].value;
        }
    }
    resolveFontOptions() {
        return this.fontOptions;
    }
    render() {
        const fontOptions = this.resolveFontOptions();
        const selectedOption = fontOptions.find(option => option.value === this.selectedFontFamily);
        const selectedFontFamily = selectedOption?.cssFontFamily ?? this.selectedFontFamily;
        const dropdownOptions = fontOptions.map(option => ({
            value: option.value,
            label: option.label,
            style: { fontFamily: option.cssFontFamily ?? option.value },
        }));
        return (h(Host, { key: '42b2805b1d2df47a1b2336dffac32ee50740809e' }, h("kritzel-dropdown", { key: '3e1f019b2ecacea061f687c93f4fdd6a384b93b7', options: dropdownOptions, value: this.selectedFontFamily, onValueChanged: this.handleDropdownValueChange, selectStyles: { fontFamily: selectedFontFamily } })));
    }
    static get watchers() { return {
        "fontOptions": [{
                "handleFontOptionsChange": 0
            }]
    }; }
};
KritzelFontFamily.style = kritzelFontFamilyCss();

export { KritzelFontFamily as kritzel_font_family };
//# sourceMappingURL=kritzel-font-family.entry.esm.js.map

//# sourceMappingURL=kritzel-font-family.entry.js.map