import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelEraserTool,
  KritzelImageTool,
  KritzelLineTool,
  KritzelSelectionTool,
  KritzelShapeTool,
  KritzelTextTool,
  KritzelToolbarControl,
  ShapeType,
} from 'kritzel-angular';

@Component({
  selector: 'app-custom-toolbar-5',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <kritzel-editor [controls]="controls"></kritzel-editor> `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class CustomToolbar5Component {
  controls: KritzelToolbarControl[] = [
    {
      name: 'selection',
      type: 'tool',
      tool: KritzelSelectionTool,
      icon: 'cursor',
      isDefault: true,
    },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      icon: 'pen',
      config: {
        type: 'pen',
        color: { light: '#000000', dark: '#ffffff' },
        size: 24,
        sizes: {
          pen: [24, 16, 8]
        },
        palettes: {
          pen: [
            { light: '#000000', dark: '#ffffff', label: 'Black' },
            { light: '#e53935', dark: '#e53935', label: 'Red' },
            { light: '#1a73e8', dark: '#1a73e8', label: 'Blue' },
          ],
        },
      },
    },
    {
      name: 'eraser',
      type: 'tool',
      tool: KritzelEraserTool,
      icon: 'eraser',
    },
    {
      name: 'line',
      type: 'tool',
      tool: KritzelLineTool,
      icon: 'arrow',
      config: {
        color: { light: '#000000', dark: '#ffffff' },
        size: 3,
        sizes: [3, 2, 1],
        palette: [
          { light: '#6d4c41', dark: '#a1887f' },
          { light: '#00897b', dark: '#4db6ac' },
          { light: '#f57c00', dark: '#ffb74d' },
        ],
        arrows: {
          end: { enabled: true, style: 'triangle' },
        },
      },
    },
    {
      name: 'shape',
      type: 'tool',
      tool: KritzelShapeTool,
      icon: 'shape-rectangle',
      config: {
        shapeType: ShapeType.Rectangle,
        fillColor: { light: 'transparent', dark: 'transparent' },
        strokeColor: { light: '#000000', dark: '#ffffff' },
        strokeWidth: 3,
        fontColor: { light: '#000000', dark: '#ffffff' },
        fontSize: 14,
        fontFamily: 'Arial',
        sizes: [8, 4, 2],
        palette: [
          { light: '#5e35b1', dark: '#b39ddb' },
          { light: '#43a047', dark: '#81c784' },
          { light: '#d81b60', dark: '#f06292' },
        ],
      },
    },
    {
      name: 'text',
      type: 'tool',
      tool: KritzelTextTool,
      icon: 'type',
      config: {
        color: { light: '#000000', dark: '#ffffff' },
        size: 16,
        sizes: [16, 12, 8],
        fontFamily: 'Arial',
        palette: [
          { light: '#ff6f00', dark: '#ffca28' },
          { light: '#2e7d32', dark: '#66bb6a' },
          { light: '#4527a0', dark: '#9575cd' },
        ],
      },
    },
    {
      name: 'image',
      type: 'tool',
      tool: KritzelImageTool,
      icon: 'image',
    },
    {
      name: 'config',
      type: 'config',
    },
  ];
}
