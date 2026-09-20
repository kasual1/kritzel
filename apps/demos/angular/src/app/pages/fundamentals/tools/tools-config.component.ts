import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelLineTool,
  KritzelSelectionTool,
  KritzelShapeTool,
  KritzelTextTool,
  KritzelToolbarItem,
  KritzelWorkspace,
  ShapeType,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-tools-config',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="tools-config"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [toolbarItems]="toolbarItems"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
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
export class ToolsConfigComponent {
  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  toolbarItems: KritzelToolbarItem[] = [
    {
      name: 'selection',
      type: 'tool',
      tool: KritzelSelectionTool,
      icon: 'cursor',
    },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      icon: 'pen',
      isDefault: true,
      config: {
        color: { light: '#dd0031', dark: '#ff5b79', label: 'Angular Red' },
        size: 8,
        opacity: 1,
        palette: [
          { light: '#dd0031', dark: '#ff5b79', label: 'Angular Red' },
          { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
          { light: '#0284c7', dark: '#38bdf8', label: 'Sky' },
        ],
        sizes: [4, 8, 16],
      },
    },
    {
      name: 'line',
      type: 'tool',
      tool: KritzelLineTool,
      icon: 'arrow',
      config: {
        color: { light: '#0284c7', dark: '#38bdf8', label: 'Sky' },
        size: 4,
        opacity: 0.8,
        palette: [
          { light: '#0284c7', dark: '#38bdf8', label: 'Sky' },
          { light: '#16a34a', dark: '#4ade80', label: 'Green' },
        ],
        sizes: [2, 4, 8],
        arrows: {
          start: { enabled: true, style: 'circle' },
          end: { enabled: true, style: 'triangle' },
        },
      },
    },
    {
      name: 'shape',
      type: 'tool',
      tool: KritzelShapeTool,
      icon: 'shapeEllipse',
      config: {
        shapeType: ShapeType.Ellipse,
        fillColor: { light: '#fee2e2', dark: '#4c1d1d' },
        strokeColor: { light: '#dd0031', dark: '#ff5b79', label: 'Angular Red' },
        strokeWidth: 4,
        opacity: 1,
        fontColor: { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
        fontSize: 16,
        fontFamily: 'Arial',
        palette: [
          { light: '#dd0031', dark: '#ff5b79', label: 'Angular Red' },
          { light: '#f59e0b', dark: '#fbbf24', label: 'Amber' },
          { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
        ],
        sizes: [2, 4, 8],
      },
      subOptions: [
        { id: 'ellipse', icon: 'shapeEllipse', label: 'Ellipse', value: ShapeType.Ellipse, toolProperty: 'shapeType' },
        { id: 'rectangle', icon: 'shapeRectangle', label: 'Rectangle', value: ShapeType.Rectangle, toolProperty: 'shapeType' },
      ],
    },
    {
      name: 'text',
      type: 'tool',
      tool: KritzelTextTool,
      icon: 'type',
      config: {
        color: { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
        size: 12,
        fontFamily: 'Georgia',
        availableFonts: ['Georgia', 'Courier New'],
        palette: [
          { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
          { light: '#dd0031', dark: '#ff5b79', label: 'Angular Red' },
        ],
        sizes: [8, 12, 24],
      },
    },
    {
      name: 'config',
      type: 'config',
    },
  ];

}
