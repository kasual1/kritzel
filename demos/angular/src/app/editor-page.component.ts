import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  IndexedDBSyncProvider,
  KritzelEditor,
  KritzelSyncConfig,
} from 'kritzel-angular';
import { ActiveWorkspaceChangeEvent, EditorIsReadyEvent, LoginEvent } from 'kritzel-stencil';

@Component({
  selector: 'app-editor-page',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
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
export class EditorPageComponent implements OnInit {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  private readonly route = inject(ActivatedRoute);

  activeWorkspaceId: string | null = null;

  syncConfig: KritzelSyncConfig = {
    providers: [IndexedDBSyncProvider]
  };

  loginConfig = {
    providers: [
      { name: 'google', label: 'Sign in with Google' },
      { name: 'apple', label: 'Sign in with Apple' },
      { name: 'facebook', label: 'Sign in with Facebook' },
    ],
    title: 'Welcome to Kritzel',
  };

  ngOnInit(): void {
    this.activeWorkspaceId = this.route.snapshot.paramMap.get('workspaceId');
  }

  onIsReady(event: CustomEvent<EditorIsReadyEvent>) {
    const editorState = event.detail;
    console.log('Editor is ready with state:', editorState);

    this.activeWorkspaceId = editorState.activeWorkspace.id;
    window.history.replaceState(null, '', `/${editorState.activeWorkspace.id}`);
  }

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    const workspace = event.detail;
    console.log('Active workspace changed:', workspace);

    this.activeWorkspaceId = workspace.id;
    window.history.replaceState(null, '', `/${workspace.id}`);
  }

  onLogin(event: CustomEvent<LoginEvent>) {
    const login = event.detail;
    console.log('Login event:', login);
  }

  onLogout() {
    console.log('Logout event');
  }

}