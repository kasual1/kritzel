import { ChangeDetectionStrategy, Component, ViewChild, signal } from '@angular/core';
import { EditorIsReadyEvent, IKritzelUser, KritzelEditor, KritzelLoginConfig, LoginEvent } from 'kritzel-angular';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';

const demoAccounts: Record<string, IKritzelUser> = {
  google: {
    id: 'user-google-1',
    displayName: 'Ada Lovelace',
    email: 'ada@example.com',
    oauthProvider: 'google',
    color: '#dd0031',
    isGuest: false,
  },
  github: {
    id: 'user-github-1',
    displayName: 'Alan Turing',
    email: 'alan@example.com',
    oauthProvider: 'github',
    color: '#1f2937',
    isGuest: false,
  },
};

@Component({
  selector: 'app-user-management-flow',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar-note">
      <strong>Login Flow:</strong>
      <span>Status: {{ status() }}</span>
      <button type="button" (click)="openDialog()">Open login dialog</button>
    </div>
    <kritzel-editor
      editorId="user-management-flow"
      [loginConfig]="loginConfig"
      [user]="user()"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (login)="onLogin($event)"
      (logout)="onLogout()"
      (isReady)="onReady($event)"
    ></kritzel-editor>
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
      .toolbar-note button {
        margin-left: auto;
        padding: 4px 10px;
        border: 1px solid #dd0031;
        border-radius: 4px;
        background: #ffffff;
        color: #dd0031;
        cursor: pointer;
        font: 12px Roboto, sans-serif;
      }
      kritzel-editor {
        flex: 1;
        min-height: 0;
      }
    `,
  ],
})
export class UserManagementFlowComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  user = signal<IKritzelUser | undefined>(undefined);

  status = signal('Signed out');

  loginConfig: KritzelLoginConfig = {
    title: 'Sign in',
    subtitle: 'Authentication is handled by your application.',
    providers: [
      { name: 'google', icon: 'google', label: 'Continue with Google' },
      { name: 'google', icon: 'facebook', label: 'Continue with Google' },
      { name: 'github', icon: 'github', label: 'Continue with GitHub' },
    ],
  };

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }

  async openDialog() {
    await this.editor.openLoginDialog();
  }

  async onLogin(event: CustomEvent<LoginEvent>) {
    const provider = event.detail.provider;
    this.status.set(`Authenticating with ${provider}...`);

    // The dialog stays in its loading state until the app resolves authentication.
    await this.editor.setLoginLoading(provider);

    const account = await this.authenticate(provider);

    await this.editor.setLoginLoading(null);
    this.user.set(account);
    this.status.set(`Signed in as ${account.displayName}`);
  }

  async onLogout() {
    this.user.set(undefined);
    this.status.set('Signed out');
  }

  private authenticate(provider: string): Promise<IKritzelUser> {
    const account = demoAccounts[provider] ?? demoAccounts['google'];
    return new Promise(resolve => setTimeout(() => resolve(account), 800));
  }
}
