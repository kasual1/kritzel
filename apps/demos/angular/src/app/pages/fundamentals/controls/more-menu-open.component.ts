import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { KritzelEditor, KritzelWorkspace } from '@kritzel/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-more-menu-open',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="control-panel">
      <label class="checkbox-control">
        <input type="checkbox" [checked]="isMoreMenuVisible()" (change)="setMoreMenuVisible($event)" />
        <span>More menu</span>
      </label>
    </div>
    <kritzel-editor
      editorId="more-menu-open"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [moreMenuItems]="moreMenuItems"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="isMoreMenuVisible()"
      (isReady)="onReady()"
    ></kritzel-editor>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .control-panel { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; }
    .checkbox-control { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #333; cursor: pointer; }
    kritzel-editor { flex: 1; }
  `,
})
export class MoreMenuOpenComponent {
  editor = viewChild(KritzelEditor);

  isMoreMenuVisible = signal(true);

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  moreMenuItems = [
    {
      id: 'notify',
      label: 'Show notification',
      icon: 'settings',
      action: () => {
        void this.editor()?.triggerNotification({
          type: 'info',
          message: 'Opened from a custom More menu action',
        });
      },
    },
    {
      id: 'center-content',
      label: 'Center content',
      icon: 'selectAll',
      action: () => {
        void this.editor()?.centerAllObjects();
      },
    },
  ];

  async onReady(): Promise<void> {
    await this.editor()?.openMoreMenu();
  }

  setMoreMenuVisible(event: Event): void {
    this.isMoreMenuVisible.set((event.target as HTMLInputElement).checked);
  }
}