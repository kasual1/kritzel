import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
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

type ToolName = 'selection' | 'brush' | 'eraser' | 'line' | 'shape' | 'text' | 'image';

@Component({
  selector: 'app-custom-toolbar-7',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      @for (tool of tools; track tool.name) {
        <button
          [class.active]="activeTool() === tool.name"
          (click)="setTool(tool.name)"
        >
          {{ tool.label }}
        </button>
      }
    </div>

    <kritzel-editor
      #editor
      [controls]="controls"
      [isControlsVisible]="false"
    ></kritzel-editor>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .toolbar {
      display: flex;
      gap: 4px;
      padding: 8px;
      border-bottom: 1px solid #e0e0e0;
    }

    .toolbar button {
      padding: 6px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
    }

    .toolbar button.active {
      background: #1a73e8;
      color: #fff;
      border-color: #1a73e8;
    }
  `,
})
export class CustomToolbar7Component {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  activeTool = signal<ToolName>('selection');

  tools: { name: ToolName; label: string }[] = [
    { name: 'selection', label: 'Select' },
    { name: 'brush', label: 'Brush' },
    { name: 'eraser', label: 'Eraser' },
    { name: 'line', label: 'Line' },
    { name: 'shape', label: 'Shape' },
    { name: 'text', label: 'Text' },
    { name: 'image', label: 'Image' },
  ];

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
        size: 8,
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
        palette: [
          { light: '#000000', dark: '#ffffff' },
          { light: '#e53935', dark: '#e53935' },
          { light: '#1a73e8', dark: '#1a73e8' },
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
        palette: [
          { light: '#000000', dark: '#ffffff' },
          { light: '#e53935', dark: '#e53935' },
          { light: '#1a73e8', dark: '#1a73e8' },
        ],
      },
      subOptions: [
        {
          id: 'rectangle',
          icon: 'shape-rectangle',
          label: 'Rectangle',
          value: ShapeType.Rectangle,
          toolProperty: 'shapeType',
        },
        {
          id: 'ellipse',
          icon: 'shape-ellipse',
          label: 'Ellipse',
          value: ShapeType.Ellipse,
          toolProperty: 'shapeType',
        },
        {
          id: 'triangle',
          icon: 'shape-triangle',
          label: 'Triangle',
          value: ShapeType.Triangle,
          toolProperty: 'shapeType',
        },
      ],
    },
    {
      name: 'text',
      type: 'tool',
      tool: KritzelTextTool,
      icon: 'type',
      config: {
        color: { light: '#000000', dark: '#ffffff' },
        size: 16,
        fontFamily: 'Arial',
        palette: [
          { light: '#000000', dark: '#ffffff' },
          { light: '#e53935', dark: '#e53935' },
          { light: '#1a73e8', dark: '#1a73e8' },
        ],
      },
    },
    {
      name: 'image',
      type: 'tool',
      tool: KritzelImageTool,
      icon: 'image',
    },
  ];

  async setTool(name: ToolName) {
    this.activeTool.set(name);
    await this.editor.changeActiveToolByName(name);
  }
}
