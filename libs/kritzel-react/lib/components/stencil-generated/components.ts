'use client';

/**
 * This file was automatically generated by the Stencil React Output Target.
 * Changes to this file may cause incorrect behavior and will be lost if the code is regenerated.
 */

/* eslint-disable */

import type { EventName, StencilReactComponent } from '@stencil/react-output-target/runtime';
import { createComponent } from '@stencil/react-output-target/runtime';
import React from 'react';
import { type ContextMenuItem, type KritzelBaseTool, type KritzelBrushTool, type KritzelContextMenuCustomEvent, type KritzelControlBrushConfigCustomEvent, type KritzelControlTextConfigCustomEvent, type KritzelEngineCustomEvent, type KritzelTextTool } from "../../../../kritzel-stencil";
import { KritzelBrushStyle as KritzelBrushStyleElement, defineCustomElement as defineKritzelBrushStyle } from "../../../../kritzel-stencil/dist/components/kritzel-brush-style.js";
import { KritzelColorPalette as KritzelColorPaletteElement, defineCustomElement as defineKritzelColorPalette } from "../../../../kritzel-stencil/dist/components/kritzel-color-palette.js";
import { KritzelColor as KritzelColorElement, defineCustomElement as defineKritzelColor } from "../../../../kritzel-stencil/dist/components/kritzel-color.js";
import { KritzelContextMenu as KritzelContextMenuElement, defineCustomElement as defineKritzelContextMenu } from "../../../../kritzel-stencil/dist/components/kritzel-context-menu.js";
import { KritzelControlBrushConfig as KritzelControlBrushConfigElement, defineCustomElement as defineKritzelControlBrushConfig } from "../../../../kritzel-stencil/dist/components/kritzel-control-brush-config.js";
import { KritzelControlTextConfig as KritzelControlTextConfigElement, defineCustomElement as defineKritzelControlTextConfig } from "../../../../kritzel-stencil/dist/components/kritzel-control-text-config.js";
import { KritzelControls as KritzelControlsElement, defineCustomElement as defineKritzelControls } from "../../../../kritzel-stencil/dist/components/kritzel-controls.js";
import { KritzelCursorTrail as KritzelCursorTrailElement, defineCustomElement as defineKritzelCursorTrail } from "../../../../kritzel-stencil/dist/components/kritzel-cursor-trail.js";
import { KritzelDropdown as KritzelDropdownElement, defineCustomElement as defineKritzelDropdown } from "../../../../kritzel-stencil/dist/components/kritzel-dropdown.js";
import { KritzelEditor as KritzelEditorElement, defineCustomElement as defineKritzelEditor } from "../../../../kritzel-stencil/dist/components/kritzel-editor.js";
import { KritzelEngine as KritzelEngineElement, defineCustomElement as defineKritzelEngine } from "../../../../kritzel-stencil/dist/components/kritzel-engine.js";
import { KritzelFontFamily as KritzelFontFamilyElement, defineCustomElement as defineKritzelFontFamily } from "../../../../kritzel-stencil/dist/components/kritzel-font-family.js";
import { KritzelFontSize as KritzelFontSizeElement, defineCustomElement as defineKritzelFontSize } from "../../../../kritzel-stencil/dist/components/kritzel-font-size.js";
import { KritzelFont as KritzelFontElement, defineCustomElement as defineKritzelFont } from "../../../../kritzel-stencil/dist/components/kritzel-font.js";
import { KritzelIcon as KritzelIconElement, defineCustomElement as defineKritzelIcon } from "../../../../kritzel-stencil/dist/components/kritzel-icon.js";
import { KritzelStrokeSize as KritzelStrokeSizeElement, defineCustomElement as defineKritzelStrokeSize } from "../../../../kritzel-stencil/dist/components/kritzel-stroke-size.js";
import { KritzelTooltip as KritzelTooltipElement, defineCustomElement as defineKritzelTooltip } from "../../../../kritzel-stencil/dist/components/kritzel-tooltip.js";
import { KritzelUtilityPanel as KritzelUtilityPanelElement, defineCustomElement as defineKritzelUtilityPanel } from "../../../../kritzel-stencil/dist/components/kritzel-utility-panel.js";

export type KritzelBrushStyleEvents = { onTypeChange: EventName<CustomEvent<'pen' | 'highlighter'>> };

export const KritzelBrushStyle: StencilReactComponent<KritzelBrushStyleElement, KritzelBrushStyleEvents> = /*@__PURE__*/ createComponent<KritzelBrushStyleElement, KritzelBrushStyleEvents>({
    tagName: 'kritzel-brush-style',
    elementClass: KritzelBrushStyleElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: { onTypeChange: 'typeChange' } as KritzelBrushStyleEvents,
    defineCustomElement: defineKritzelBrushStyle
});

export type KritzelColorEvents = NonNullable<unknown>;

export const KritzelColor: StencilReactComponent<KritzelColorElement, KritzelColorEvents> = /*@__PURE__*/ createComponent<KritzelColorElement, KritzelColorEvents>({
    tagName: 'kritzel-color',
    elementClass: KritzelColorElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: {} as KritzelColorEvents,
    defineCustomElement: defineKritzelColor
});

export type KritzelColorPaletteEvents = { onColorChange: EventName<CustomEvent<string>> };

export const KritzelColorPalette: StencilReactComponent<KritzelColorPaletteElement, KritzelColorPaletteEvents> = /*@__PURE__*/ createComponent<KritzelColorPaletteElement, KritzelColorPaletteEvents>({
    tagName: 'kritzel-color-palette',
    elementClass: KritzelColorPaletteElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: { onColorChange: 'colorChange' } as KritzelColorPaletteEvents,
    defineCustomElement: defineKritzelColorPalette
});

export type KritzelContextMenuEvents = { onActionSelected: EventName<KritzelContextMenuCustomEvent<ContextMenuItem>> };

export const KritzelContextMenu: StencilReactComponent<KritzelContextMenuElement, KritzelContextMenuEvents> = /*@__PURE__*/ createComponent<KritzelContextMenuElement, KritzelContextMenuEvents>({
    tagName: 'kritzel-context-menu',
    elementClass: KritzelContextMenuElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: { onActionSelected: 'actionSelected' } as KritzelContextMenuEvents,
    defineCustomElement: defineKritzelContextMenu
});

export type KritzelControlBrushConfigEvents = { onToolChange: EventName<KritzelControlBrushConfigCustomEvent<KritzelBrushTool>> };

export const KritzelControlBrushConfig: StencilReactComponent<KritzelControlBrushConfigElement, KritzelControlBrushConfigEvents> = /*@__PURE__*/ createComponent<KritzelControlBrushConfigElement, KritzelControlBrushConfigEvents>({
    tagName: 'kritzel-control-brush-config',
    elementClass: KritzelControlBrushConfigElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: { onToolChange: 'toolChange' } as KritzelControlBrushConfigEvents,
    defineCustomElement: defineKritzelControlBrushConfig
});

export type KritzelControlTextConfigEvents = { onToolChange: EventName<KritzelControlTextConfigCustomEvent<KritzelTextTool>> };

export const KritzelControlTextConfig: StencilReactComponent<KritzelControlTextConfigElement, KritzelControlTextConfigEvents> = /*@__PURE__*/ createComponent<KritzelControlTextConfigElement, KritzelControlTextConfigEvents>({
    tagName: 'kritzel-control-text-config',
    elementClass: KritzelControlTextConfigElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: { onToolChange: 'toolChange' } as KritzelControlTextConfigEvents,
    defineCustomElement: defineKritzelControlTextConfig
});

export type KritzelControlsEvents = { onControlsReady: EventName<CustomEvent<void>> };

export const KritzelControls: StencilReactComponent<KritzelControlsElement, KritzelControlsEvents> = /*@__PURE__*/ createComponent<KritzelControlsElement, KritzelControlsEvents>({
    tagName: 'kritzel-controls',
    elementClass: KritzelControlsElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: { onControlsReady: 'controlsReady' } as KritzelControlsEvents,
    defineCustomElement: defineKritzelControls
});

export type KritzelCursorTrailEvents = NonNullable<unknown>;

export const KritzelCursorTrail: StencilReactComponent<KritzelCursorTrailElement, KritzelCursorTrailEvents> = /*@__PURE__*/ createComponent<KritzelCursorTrailElement, KritzelCursorTrailEvents>({
    tagName: 'kritzel-cursor-trail',
    elementClass: KritzelCursorTrailElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: {} as KritzelCursorTrailEvents,
    defineCustomElement: defineKritzelCursorTrail
});

export type KritzelDropdownEvents = { onValueChanged: EventName<CustomEvent<string>> };

export const KritzelDropdown: StencilReactComponent<KritzelDropdownElement, KritzelDropdownEvents> = /*@__PURE__*/ createComponent<KritzelDropdownElement, KritzelDropdownEvents>({
    tagName: 'kritzel-dropdown',
    elementClass: KritzelDropdownElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: { onValueChanged: 'valueChanged' } as KritzelDropdownEvents,
    defineCustomElement: defineKritzelDropdown
});

export type KritzelEditorEvents = NonNullable<unknown>;

export const KritzelEditor: StencilReactComponent<KritzelEditorElement, KritzelEditorEvents> = /*@__PURE__*/ createComponent<KritzelEditorElement, KritzelEditorEvents>({
    tagName: 'kritzel-editor',
    elementClass: KritzelEditorElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: {} as KritzelEditorEvents,
    defineCustomElement: defineKritzelEditor
});

export type KritzelEngineEvents = {
    onEngineReady: EventName<CustomEvent<void>>,
    onActiveToolChange: EventName<KritzelEngineCustomEvent<KritzelBaseTool>>
};

export const KritzelEngine: StencilReactComponent<KritzelEngineElement, KritzelEngineEvents> = /*@__PURE__*/ createComponent<KritzelEngineElement, KritzelEngineEvents>({
    tagName: 'kritzel-engine',
    elementClass: KritzelEngineElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: {
        onEngineReady: 'engineReady',
        onActiveToolChange: 'activeToolChange'
    } as KritzelEngineEvents,
    defineCustomElement: defineKritzelEngine
});

export type KritzelFontEvents = NonNullable<unknown>;

export const KritzelFont: StencilReactComponent<KritzelFontElement, KritzelFontEvents> = /*@__PURE__*/ createComponent<KritzelFontElement, KritzelFontEvents>({
    tagName: 'kritzel-font',
    elementClass: KritzelFontElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: {} as KritzelFontEvents,
    defineCustomElement: defineKritzelFont
});

export type KritzelFontFamilyEvents = { onFontFamilyChange: EventName<CustomEvent<string>> };

export const KritzelFontFamily: StencilReactComponent<KritzelFontFamilyElement, KritzelFontFamilyEvents> = /*@__PURE__*/ createComponent<KritzelFontFamilyElement, KritzelFontFamilyEvents>({
    tagName: 'kritzel-font-family',
    elementClass: KritzelFontFamilyElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: { onFontFamilyChange: 'fontFamilyChange' } as KritzelFontFamilyEvents,
    defineCustomElement: defineKritzelFontFamily
});

export type KritzelFontSizeEvents = { onSizeChange: EventName<CustomEvent<number>> };

export const KritzelFontSize: StencilReactComponent<KritzelFontSizeElement, KritzelFontSizeEvents> = /*@__PURE__*/ createComponent<KritzelFontSizeElement, KritzelFontSizeEvents>({
    tagName: 'kritzel-font-size',
    elementClass: KritzelFontSizeElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: { onSizeChange: 'sizeChange' } as KritzelFontSizeEvents,
    defineCustomElement: defineKritzelFontSize
});

export type KritzelIconEvents = NonNullable<unknown>;

export const KritzelIcon: StencilReactComponent<KritzelIconElement, KritzelIconEvents> = /*@__PURE__*/ createComponent<KritzelIconElement, KritzelIconEvents>({
    tagName: 'kritzel-icon',
    elementClass: KritzelIconElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: {} as KritzelIconEvents,
    defineCustomElement: defineKritzelIcon
});

export type KritzelStrokeSizeEvents = { onSizeChange: EventName<CustomEvent<number>> };

export const KritzelStrokeSize: StencilReactComponent<KritzelStrokeSizeElement, KritzelStrokeSizeEvents> = /*@__PURE__*/ createComponent<KritzelStrokeSizeElement, KritzelStrokeSizeEvents>({
    tagName: 'kritzel-stroke-size',
    elementClass: KritzelStrokeSizeElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: { onSizeChange: 'sizeChange' } as KritzelStrokeSizeEvents,
    defineCustomElement: defineKritzelStrokeSize
});

export type KritzelTooltipEvents = NonNullable<unknown>;

export const KritzelTooltip: StencilReactComponent<KritzelTooltipElement, KritzelTooltipEvents> = /*@__PURE__*/ createComponent<KritzelTooltipElement, KritzelTooltipEvents>({
    tagName: 'kritzel-tooltip',
    elementClass: KritzelTooltipElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: {} as KritzelTooltipEvents,
    defineCustomElement: defineKritzelTooltip
});

export type KritzelUtilityPanelEvents = {
    onUndo: EventName<CustomEvent<void>>,
    onRedo: EventName<CustomEvent<void>>,
    onDelete: EventName<CustomEvent<void>>
};

export const KritzelUtilityPanel: StencilReactComponent<KritzelUtilityPanelElement, KritzelUtilityPanelEvents> = /*@__PURE__*/ createComponent<KritzelUtilityPanelElement, KritzelUtilityPanelEvents>({
    tagName: 'kritzel-utility-panel',
    elementClass: KritzelUtilityPanelElement,
    // @ts-ignore - ignore potential React type mismatches between the Stencil Output Target and your project.
    react: React,
    events: {
        onUndo: 'undo',
        onRedo: 'redo',
        onDelete: 'delete'
    } as KritzelUtilityPanelEvents,
    defineCustomElement: defineKritzelUtilityPanel
});
