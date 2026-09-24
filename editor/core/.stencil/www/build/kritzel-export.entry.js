import { r as registerInstance, a as createEvent, h, d as Host } from './index-BDyeD8t8.js';

const kritzelExportCss = () => `:host{display:flex;flex-direction:column;min-height:0}.export-content{display:flex;flex-direction:column;gap:16px;padding:0;flex:1}.export-content kritzel-pill-tabs{align-self:center}.export-tab-content{display:flex;flex-direction:column;gap:16px;min-height:330px}.format-selection{display:flex;flex-direction:column;gap:6px}.format-selection label{font-size:14px;font-weight:500;color:var(--kritzel-global-text-primary, #333)}.export-primary-button{width:100%;padding:12px 24px;background-color:var(--kritzel-global-primary-color, #007AFF);color:var(--kritzel-global-primary-text-color, #fff);border:none;border-radius:var(--kritzel-button-border-radius, 8px);font-size:14px;font-weight:600;cursor:pointer;transition:background-color 0.2s ease;-webkit-tap-highlight-color:transparent}.export-primary-button:hover{background-color:var(--kritzel-global-primary-hover-color, #0066d6)}.export-primary-button:focus-visible{outline:revert;outline-offset:revert}.preview-container{width:100%;display:flex;justify-content:center;align-items:center;box-sizing:border-box;margin-bottom:8px}.preview-container img{max-width:100%;max-height:250px;object-fit:contain;box-shadow:0 4px 8px rgba(0, 0, 0, 0.15);border-radius:4px;border:1px solid var(--kritzel-global-border-color, #dbdbdb)}.export-content p{margin:0;color:var(--kritzel-global-text-secondary, #666)}@media (max-width: 576px){.export-tab-content{flex:1;min-height:0}}`;

const KritzelExport = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.exportPng = createEvent(this, "exportPng", 7);
        this.exportSvg = createEvent(this, "exportSvg", 7);
        this.exportJson = createEvent(this, "exportJson", 7);
    }
    /**
     * The name of the current workspace, used as default filename
     */
    workspaceName = 'workspace';
    /** Resolved localized strings keyed by term key, supplied by the editor. */
    terms = {};
    isDialogOpen = false;
    previewUrl;
    isLoading = false;
    activeTab = 'viewport';
    exportFilename = '';
    viewportExportFormat = 'png';
    exportPng;
    exportSvg;
    exportJson;
    get tabs() {
        return [
            { id: 'viewport', label: this.terms['export.tabs.viewport'] ?? 'Export Viewport' },
            { id: 'workspace', label: this.terms['export.tabs.workspace'] ?? 'Export Workspace' },
        ];
    }
    viewportFormatOptions = [
        { value: 'png', label: 'PNG' },
        { value: 'svg', label: 'SVG' },
    ];
    async open(previewUrl) {
        this.previewUrl = previewUrl;
        this.activeTab = 'viewport';
        this.viewportExportFormat = 'png';
        this.exportFilename = this.generateDefaultFilename();
        this.isDialogOpen = true;
    }
    async close() {
        this.closeDialog();
    }
    generateDefaultFilename() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        return `${this.workspaceName}-${timestamp}`;
    }
    handleFilenameChange = (event) => {
        this.exportFilename = event.detail;
    };
    closeDialog = () => {
        this.isDialogOpen = false;
    };
    handleTabChange = (event) => {
        this.activeTab = event.detail;
    };
    handleViewportFormatChange = (event) => {
        this.viewportExportFormat = event.detail;
    };
    handleExport = () => {
        if (this.activeTab === 'viewport') {
            if (this.viewportExportFormat === 'png') {
                this.exportPng.emit();
            }
            else {
                this.exportSvg.emit();
            }
        }
        else {
            this.exportJson.emit(this.exportFilename || this.generateDefaultFilename());
        }
        this.closeDialog();
    };
    renderViewportExport() {
        return (h("div", { class: "export-tab-content" }, this.previewUrl && (h("div", { class: "preview-container" }, h("img", { src: this.previewUrl, alt: "Viewport Preview" }))), h("kritzel-input", { label: this.terms['export.filename.label'] ?? 'Filename', value: this.exportFilename, placeholder: this.terms['export.filename.placeholder'] ?? 'Enter filename', suffix: `.${this.viewportExportFormat}`, onValueChange: this.handleFilenameChange }), h("div", { class: "format-selection" }, h("label", null, this.terms['export.format.label'] ?? 'Format'), h("kritzel-dropdown", { options: this.viewportFormatOptions, value: this.viewportExportFormat, forceOpenDirection: "up", onValueChanged: this.handleViewportFormatChange }))));
    }
    renderWorkspaceExport() {
        return (h("div", { class: "export-tab-content" }, h("kritzel-input", { label: this.terms['export.filename.label'] ?? 'Filename', value: this.exportFilename, placeholder: this.terms['export.filename.placeholder'] ?? 'Enter filename', suffix: ".json", onValueChange: this.handleFilenameChange })));
    }
    render() {
        return (h(Host, { key: '60baf80591c9456aa32443a43f9af102ed711494' }, h("kritzel-dialog", { key: 'f8c744284000b356dc9c3de12252c0358909c9de', isOpen: this.isDialogOpen, dialogTitle: this.terms['export.dialogTitle'] ?? 'Export', closable: true, contained: true, onDialogClose: this.closeDialog }, h("div", { key: '9f5f5e56302cc9c1d1c173757fe720871e085ca0', class: "export-content" }, h("kritzel-pill-tabs", { key: '3976ad59d19c90c8d1a605815cb7d90cebede5e3', tabs: this.tabs, value: this.activeTab, onValueChange: this.handleTabChange }), this.activeTab === 'viewport' && this.renderViewportExport(), this.activeTab === 'workspace' && this.renderWorkspaceExport()), h("div", { key: '992dad8deb946feebd453d452f0e7338dbdb2236', slot: "footer" }, h("button", { key: '8c9d907a82a45e9ad2b48618ff6e812c804d7252', class: "export-primary-button", onClick: this.handleExport }, this.terms['export.exportButton'] ?? 'Export')))));
    }
};
KritzelExport.style = kritzelExportCss();

export { KritzelExport as kritzel_export };
//# sourceMappingURL=kritzel-export.entry.esm.js.map

//# sourceMappingURL=kritzel-export.entry.js.map