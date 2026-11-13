import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { UpdrawEditor, UpdrawLoginConfig, UpdrawWorkspace } from '@updraw/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';

const providerIcons: Record<string, string> = {
  'auth-google':
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 12h5a5 5 0 1 1-1.6-3.6"/></svg>',
  'auth-github':
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18-6-6 6-6"/><path d="m15 6 6 6-6 6"/></svg>',
  'auth-microsoft':
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>',
  'auth-email':
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
};

@Component({
  selector: 'app-user-management-providers',
  imports: [UpdrawEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <updraw-editor
      editorId="user-management-providers"
      [loginConfig]="loginConfig"
      [customSvgIcons]="providerIcons"
      [workspaces]="workspaces()"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady()"
    ></updraw-editor>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .toolbar-note {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f5f5f5;
        border-bottom: 1px solid #ebebeb;
        font: 13px Roboto, sans-serif;
      }
      .toolbar-note strong {
        color: #dd0031;
      }
      .toolbar-note span {
        color: #555;
      }
      updraw-editor {
        flex: 1;
        min-height: 0;
      }
    `,
  ],
})
export class UserManagementProvidersComponent {
  @ViewChild(UpdrawEditor) editor!: UpdrawEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpdrawWorkspace({ objects: createSeedObjects() })]);

  providerIcons = providerIcons;

  loginConfig: UpdrawLoginConfig = {
    title: 'Sign in to Updraw',
    providers: [
      { name: 'google', icon: 'google', label: 'Continue with Google' },
      { name: 'facebook', icon: 'facebook', label: 'Continue with Facebook' },
      { name: 'github', icon: 'github', label: 'Continue with GitHub'},
    ],
  };

  async onReady() {
    await this.editor.openLoginDialog();
  }
}
