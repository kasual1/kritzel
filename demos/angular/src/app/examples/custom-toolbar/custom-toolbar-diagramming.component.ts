import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KritzelEditor,
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
  selector: 'app-custom-toolbar-diagramming',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="custom-toolbar-diagramming"
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
export class CustomToolbarDiagrammingComponent {
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
      name: 'separator-tools',
      type: 'separator',
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
      name: 'config',
      type: 'config',
    },
  ];
}
