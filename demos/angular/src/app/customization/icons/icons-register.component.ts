import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import {
  ContextMenuItem,
  KritzelBrushTool,
  KritzelEditor,
  KritzelSelectionTool,
  KritzelTextTool,
  KritzelToolbarItem,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

const customSvgIcons: Record<string, string> = {
  'brand-select': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 3 14 8-6 2-2 6Z"/><path d="m11 13 4 5"/></svg>',
  'brand-ink': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m20 4-9.5 9.5"/><path d="m15 3 6 6"/><path d="m4 20 4.5-1 9-9-3.5-3.5-9 9Z"/><path d="M3 21h18"/></svg>',
  'brand-label': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16"/><path d="M12 5v14"/><path d="M8 19h8"/></svg>',
  'brand-export': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
};

@Component({
  selector: 'app-icons-register',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar-note">
      <strong>Custom SVG Icons:</strong>
      <span>Registered icons are reused by the toolbar and context menu below.</span>
    </div>
    <kritzel-editor
      editorId="icons-register"
      [customSvgIcons]="customSvgIcons"
      [toolbarItems]="toolbarItems"
      [globalContextMenuItems]="globalItems"
      [objectContextMenuItems]="objectItems"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady()"
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .toolbar-note { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; font: 13px Roboto, sans-serif; }
    .toolbar-note strong { color: #dd0031; }
    .toolbar-note span { color: #555; }
    kritzel-editor { flex: 1; min-height: 0; }
  `],
})
export class IconsRegisterComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];
  customSvgIcons = customSvgIcons;

  toolbarItems: KritzelToolbarItem[] = [
    { name: 'select', type: 'tool', tool: KritzelSelectionTool, icon: 'brand-select', isDefault: true },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      icon: 'brand-ink',
      config: {
        type: 'pen',
        color: { light: '#1f2937', dark: '#f3f4f6' },
        size: 6,
        palettes: { pen: [{ light: '#1f2937', dark: '#f3f4f6' }] },
      },
    },
    {
      name: 'text',
      type: 'tool',
      tool: KritzelTextTool,
      icon: 'brand-label',
      config: {
        color: { light: '#1f2937', dark: '#f3f4f6' },
        size: 18,
        fontFamily: 'Arial',
        palette: [{ light: '#1f2937', dark: '#f3f4f6' }],
      },
    },
  ];

  globalItems: ContextMenuItem[] = [
    { label: 'Export board', icon: 'brand-export', action: () => undefined },
  ];

  objectItems: ContextMenuItem[] = [
    { label: 'Export selection', icon: 'brand-export', action: () => undefined },
  ];

  async onReady() {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
    await this.editor.openContextMenu({ x: -50, y: -50 });
  }
}
