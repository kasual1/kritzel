import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ContextMenuItem, KritzelEditor } from '@kritzel/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

const customSvgIcons: Record<string, string> = {
  'brand-export': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
};

@Component({
  selector: 'app-icons-register-new',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="icons-register-new"
      [customSvgIcons]="customSvgIcons"
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
    :host { display: block; height: 100%; }
    kritzel-editor { display: block; height: 100%; }
  `],
})
export class IconsRegisterNewComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];
  customSvgIcons = customSvgIcons;

  globalItems: ContextMenuItem[] = [
    { label: 'Export board', icon: 'brand-export', action: () => undefined },
  ];

  objectItems: ContextMenuItem[] = [
    { label: 'Export selection', icon: 'brand-export', action: () => undefined },
  ];

  async onReady() {
    for (const object of createSeedObjects()) {
      await this.editor.addObject(object);
    }
    await this.editor.openContextMenu({ x: -50, y: -50 });
  }
}
