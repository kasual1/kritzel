import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  signal,
} from '@angular/core';
import {
  IUpdrawUser,
  UpdrawEditor,
  UpdrawLoginConfig,
  UpdrawWorkspace,
  LoginEvent,
} from '@updraw/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-user-management-logout',
  imports: [UpdrawEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <updraw-editor
      editorId="user-management-logout"
      [loginConfig]="loginConfig"
      [user]="user()"
      [workspaces]="workspaces()"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady()"
      (login)="onLogin($event)"
      (logout)="onLogout()"
    ></updraw-editor>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      updraw-editor {
        flex: 1;
        min-height: 0;
      }
    `,
  ],
})
export class UserManagementLogoutComponent {
  @ViewChild(UpdrawEditor) editor!: UpdrawEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpdrawWorkspace({ objects: createSeedObjects() })]);

  user = signal<IUpdrawUser | undefined>({
    id: `user-google-1`,
    displayName: 'Ada Lovelace',
    color: '#dd0031',
    isGuest: false,
  });

  loginConfig: UpdrawLoginConfig = {
    title: 'Sign in',
    providers: [
      { name: 'google', icon: 'google', label: 'Continue with Google' },
      { name: 'facebook', icon: 'facebook', label: 'Continue with Facebook' },
      { name: 'github', icon: 'github', label: 'Continue with GitHub' },
    ],
  };

  async onReady() {
    await this.editor.openUserDialog();
  }

  async onLogin(event: CustomEvent<LoginEvent>) {
    const provider = event.detail.provider;

    // Simulate authentication, this part would normally involve your own authentication logic.
    const account = {
      id: `user-${provider}-1`,
      displayName: 'Ada Lovelace',
      color: '#dd0031',
      isGuest: false,
    };

    this.user.set(account);
    this.editor.closeLoginDialog();
  }

  onLogout() {
    this.user.set(undefined);
  }
}
