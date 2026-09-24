import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelUtilityPanelCss = () => `:host{display:flex;flex-direction:row;align-items:center;padding:4px;gap:8px;border-top-left-radius:12px;border-top-right-radius:12px;background-color:var(--kritzel-utility-panel-background-color, #e2e2e2);width:fit-content;user-select:none;z-index:1}.utility-button{display:flex;justify-content:center;align-items:center;width:28px;height:28px;padding:8px 4px;border:none;background:none;cursor:var(--kritzel-global-pointer-cursor, pointer);color:var(--kritzel-utility-panel-button-color, #333333);--kritzel-icon-color:var(--kritzel-utility-panel-button-color, #333333);-webkit-tap-highlight-color:transparent;border-radius:var(--kritzel-utility-panel-button-border-radius, 8px)}.utility-button:hover,.utility-button:focus-visible{background-color:var(--kritzel-utility-panel-button-hover-background-color, hsl(0, 0%, 0%, 4.3%))}.utility-button:disabled{opacity:0.4;cursor:not-allowed;pointer-events:none}.utility-separator{width:1px;height:16px;background-color:var(--kritzel-utility-panel-separator-color, hsl(0, 0%, 0%, 8%))}`;

const KritzelUtilityPanel = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.undo = createEvent(this, "undo", 7);
        this.redo = createEvent(this, "redo", 7);
        this.delete = createEvent(this, "delete", 7);
    }
    undoState = null;
    /** Resolved localized strings keyed by term key, supplied by the editor. */
    terms = {};
    undo;
    redo;
    delete;
    handleUndo(event) {
        if (event.cancelable) {
            event.preventDefault();
            event.stopPropagation();
            this.undo.emit();
        }
    }
    handleRedo(event) {
        event.preventDefault();
        event.stopPropagation();
        this.redo.emit();
    }
    render() {
        return (h(Host, { key: '716bf600bb8ef3e1c7663183c2b4d2927e554faf' }, h("button", { key: '64b300d1d10c30d623fce76a919610e7b553c504', class: "utility-button", "data-testid": "utility-undo", disabled: !this.undoState?.canUndo, onClick: event => this.handleUndo(event), "aria-label": this.terms['utility.undo'] ?? 'Undo' }, h("kritzel-icon", { key: '86c0711e5a61f837bf279600e27d896a81ae1d5c', name: "undo" })), h("button", { key: '9052c2023254caca5109364b1c82d42e0900d54b', class: "utility-button", "data-testid": "utility-redo", disabled: !this.undoState?.canRedo, onClick: event => this.handleRedo(event), "aria-label": this.terms['utility.redo'] ?? 'Redo' }, h("kritzel-icon", { key: '03060f21b1551bcdae724b4de03010127647c036', name: "redo" })), h("div", { key: '5ac88e76663bb2d5c90f16b76021123fe64d898a', class: "utility-separator" }), h("button", { key: '7cbbc765c1c4b642d8371a25348d1d886b9b5440', class: "utility-button", "data-testid": "utility-delete", onClick: () => this.delete.emit(), "aria-label": this.terms['utility.delete'] ?? 'Delete selected items' }, h("kritzel-icon", { key: 'a8f6c8e8a8783e45d781b50aa7aec51b3f29dd5c', name: "delete" }))));
    }
};
KritzelUtilityPanel.style = kritzelUtilityPanelCss();

export { KritzelUtilityPanel as kritzel_utility_panel };
//# sourceMappingURL=kritzel-utility-panel.entry.esm.js.map

//# sourceMappingURL=kritzel-utility-panel.entry.js.map