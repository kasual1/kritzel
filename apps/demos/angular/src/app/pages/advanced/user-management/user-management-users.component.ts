import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { IKritzelUser, KritzelEditor, KritzelWorkspace } from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';

const currentUser: IKritzelUser = {
  id: 'user-current-1',
  displayName: 'Ada Lovelace',
  email: 'ada@example.com',
  oauthProvider: 'demo',
  color: '#dd0031',
  isGuest: false,
};

const collaborators: IKritzelUser[] = [
  {
    id: 'user-collaborator-1',
    displayName: 'Grace Hopper',
    email: 'grace@example.com',
    oauthProvider: 'demo',
    color: '#0f766e',
    isGuest: false,
  },
  {
    id: 'user-collaborator-2',
    displayName: 'Katherine Johnson',
    email: 'katherine@example.com',
    oauthProvider: 'demo',
    color: '#7c3aed',
    isGuest: false,
  },
  {
    id: 'user-collaborator-3',
    displayName: 'Margaret Hamilton',
    email: 'margaret@example.com',
    oauthProvider: 'demo',
    color: '#ea580c',
    isGuest: false,
  },
];

@Component({
  selector: 'app-user-management-users',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="user-management-users"
      [user]="user()"
      [activeUsers]="activeUsers()"
      [workspaces]="workspaces()"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
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
        padding: 4px 10px;
        border: 1px solid #dd0031;
        border-radius: 4px;
        background: #ffffff;
        color: #dd0031;
        cursor: pointer;
        font: 12px Roboto, sans-serif;
      }
      .toolbar-note button:first-of-type {
        margin-left: auto;
      }
      kritzel-editor {
        flex: 1;
        min-height: 0;
      }
    `,
  ],
})
export class UserManagementUsersComponent {
  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  user = signal<IKritzelUser | undefined>(currentUser);

  activeUsers = signal<IKritzelUser[]>(collaborators);

  visibleUserCount = computed(() => this.activeUsers().length + (this.user() ? 1 : 0));

}