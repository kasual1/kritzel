import { r as registerInstance, h, d as Host } from './index-BDyeD8t8.js';
import { B as KritzelColorHelper } from './index-BEzQin2J.js';
import './yjs-CvNgPRai.js';

const kritzelColorCss = () => `:host{display:flex}.checkerboard-bg{background:repeating-conic-gradient(        var(--kritzel-checkerboard-color-dark, #ccc) 0% 25%,        var(--kritzel-checkerboard-color-light, #fff) 0% 50%      )      50% / 8px 8px;position:relative;overflow:hidden}.color-circle{width:24px;height:24px;border-radius:50%;box-sizing:border-box;display:block}.color-circle.white{border:1px solid var(--kritzel-color-palette-circle-border-color, #dddcdc)}`;

const KritzelColorComponent = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
    }
    value;
    theme;
    size = 24;
    resolveColor() {
        if (!this.value)
            return '';
        if (typeof this.value === 'string')
            return this.value;
        return KritzelColorHelper.resolveThemeColor(this.value, this.theme);
    }
    isLightColor(hexColor) {
        if (!hexColor)
            return false;
        let r = 0, g = 0, b = 0;
        let sanitizedHex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
        if (sanitizedHex.length === 3) {
            r = parseInt(sanitizedHex[0] + sanitizedHex[0], 16);
            g = parseInt(sanitizedHex[1] + sanitizedHex[1], 16);
            b = parseInt(sanitizedHex[2] + sanitizedHex[2], 16);
        }
        else if (sanitizedHex.length === 6) {
            r = parseInt(sanitizedHex.substring(0, 2), 16);
            g = parseInt(sanitizedHex.substring(2, 4), 16);
            b = parseInt(sanitizedHex.substring(4, 6), 16);
        }
        else {
            return false;
        }
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return false;
        }
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        return luminance > 220;
    }
    render() {
        const resolvedColor = this.resolveColor();
        const isColorVeryLight = this.isLightColor(resolvedColor);
        return (h(Host, { key: 'b0543e30ee8a4a79aa0487f207eb8174b2b26e08' }, h("div", { key: 'e88eb0d0eb80ba925b94c16637ed168e1b0c76fb', class: "checkerboard-bg", style: {
                width: `${this.size}px`,
                height: `${this.size}px`,
                borderRadius: '50%',
                display: 'inline-block',
                position: 'relative',
            } }, h("div", { key: '86381f69b78fc987c581daf19302049fb137afb7', class: {
                'color-circle': true,
                'white': isColorVeryLight,
            }, style: {
                backgroundColor: resolvedColor,
                width: `${this.size}px`,
                height: `${this.size}px`,
                borderRadius: '50%',
                position: 'absolute',
                top: '0',
                left: '0',
                display: 'inline-block',
            } }))));
    }
};
KritzelColorComponent.style = kritzelColorCss();

export { KritzelColorComponent as kritzel_color };
//# sourceMappingURL=kritzel-color.entry.esm.js.map

//# sourceMappingURL=kritzel-color.entry.js.map