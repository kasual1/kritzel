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
  InMemorySyncProvider,
  KritzelSyncConfig,
} from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-custom-toolbar-full-drawing-app',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="custom-toolbar-full-drawing-app"
      [wheelEnabled]="false"
      [theme]="'angular-theme'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [controls]="controls"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></kritzel-editor>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class CustomToolbarFullDrawingAppComponent {
  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider]
  };

  controls: KritzelToolbarControl[] = [
    {
      name: 'selection',
      type: 'tool',
      tool: KritzelSelectionTool,
      icon: 'cursor',
      isDefault: true,
    },
    {
      name: 'separator-draw',
      type: 'separator',
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
    {
      name: 'separator-config',
      type: 'separator',
    },
    {
      name: 'config',
      type: 'config',
    },
  ];
}
