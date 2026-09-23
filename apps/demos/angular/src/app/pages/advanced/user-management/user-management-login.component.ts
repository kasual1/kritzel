import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  signal,
} from '@angular/core';
import {
  IKritzelUser,
  KritzelEditor,
  KritzelLoginConfig,
  KritzelWorkspace,
  LoginEvent,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-user-management-login',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="user-management-login"
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
    ></kritzel-editor>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      kritzel-editor {
        flex: 1;
        min-height: 0;
      }
    `,
  ],
})
export class UserManagementLoginComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  user = signal<IKritzelUser | undefined>(undefined);

  loginConfig: KritzelLoginConfig = {
    title: 'Sign in',
    providers: [
      { name: 'google', icon: 'google', label: 'Continue with Google' },
      { name: 'facebook', icon: 'facebook', label: 'Continue with Facebook' },
      { name: 'github', icon: 'github', label: 'Continue with GitHub' },
    ],
  };

  async onReady() {
    await this.editor.openLoginDialog();
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
