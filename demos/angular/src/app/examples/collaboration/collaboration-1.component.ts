import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  IndexedDBSyncProvider,
  KritzelEditor,
  KritzelSyncConfig,
  ActiveWorkspaceChangeEvent,
  EditorIsReadyEvent,
  HocuspocusSyncProvider,
  LoginEvent,
} from 'kritzel-angular';
import { UserData } from '../../resolvers/user.resolver';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-editor-page',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      [theme]="'angular-theme'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [loginConfig]="loginConfig"
      [activeWorkspaceId]="activeWorkspaceId"
      (isReady)="onIsReady($event)"
      (login)="onLogin($event)"
      (logout)="onLogout()"
      (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
    ></kritzel-editor>
  `,
})
export class Collaboration1Component implements OnInit {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [customAngularTheme];

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  activeWorkspaceId: string | null = null;

  isShared = false;

  syncConfig!: KritzelSyncConfig;

  loginConfig = {
    providers: [
      { name: 'google', label: 'Sign in with Google' },
      { name: 'apple', label: 'Sign in with Apple' },
      { name: 'facebook', label: 'Sign in with Facebook' },
    ],
    title: 'Welcome to Kritzel',
  };

  ngOnInit(): void {
    const user = this.route.snapshot.data['user'] as UserData;

    this.activeWorkspaceId = this.route.snapshot.params['workspaceId'];

    this.isShared = this.route.snapshot.queryParams['share'] === 'true';

    this.syncConfig = {
      appStateId: user.id,
      providers: [IndexedDBSyncProvider, HocuspocusSyncProvider],
    };
  }

  async onIsReady(event: CustomEvent<EditorIsReadyEvent>) {
    const editorState = event.detail;
    console.log('Editor is ready with state:', editorState);

    if (this.isShared && this.activeWorkspaceId) {
      await this.editor.loadSharedWorkspace(this.activeWorkspaceId);
      return;
    }

    this.activeWorkspaceId = editorState.activeWorkspace.id;
    this.router.navigate(['/examples/collaboration-1', editorState.activeWorkspace.id], { replaceUrl: true });
  }

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    const workspace = event.detail;
    this.activeWorkspaceId = workspace.id;
    this.router.navigate(['/examples/collaboration-1', workspace.id], { replaceUrl: true });
  }

  onLogin(event: CustomEvent<LoginEvent>) {
    const login = event.detail;
    console.log('Login event:', login);
  }

  onLogout() {
    console.log('Logout event');
  }
}
