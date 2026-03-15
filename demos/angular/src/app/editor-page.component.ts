import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  IndexedDBSyncProvider,
  KritzelEditor,
  KritzelSyncConfig,
  KritzelWorkspace,
} from 'kritzel-angular';

@Component({
  selector: 'app-editor-page',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      [syncConfig]="syncConfig"
      [activeWorkspaceId]="activeWorkspaceId"
      (isReady)="onEditorReady()"
      (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
    ></kritzel-editor>
  `,
})
export class EditorPageComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isInitialized: boolean = false;

  activeWorkspaceId: string | undefined;

  syncConfig: KritzelSyncConfig = {
    appStateId: 'kritzel-angular-demo',
    providers: [IndexedDBSyncProvider],
  };

  constructor() {
    this.activeWorkspaceId = this.route.snapshot.params['workspaceId'];
  }

  async onEditorReady() {
    const workspaceId = this.route.snapshot.params['workspaceId'];
    const isShared = this.route.snapshot.queryParams['share'] === 'true';

    if (isShared && workspaceId) {
      const workspace = new KritzelWorkspace(workspaceId, 'New');
      await this.editor.createWorkspace(workspace);
    } else {
      this.activeWorkspaceId = workspaceId;
    }

    this.isInitialized = true;

    const { share, ...remainingParams } = this.route.snapshot.queryParams;
    if (share) {
      this.router.navigate([], { queryParams: remainingParams, replaceUrl: true });
    }
  }

  onActiveWorkspaceChange(event: CustomEvent<{ id?: string }>) {
    console.log('Active workspace changed:', event.detail?.id, this.isInitialized);
    if(!this.isInitialized) {
      return;
    }

    const workspaceId = event.detail?.id;
    if (!workspaceId) {
      return;
    }

    const currentPath = this.router.url.split('?')[0].split('#')[0];
    if (currentPath === `/${workspaceId}`) {
      return;
    }

    this.router.navigate([workspaceId], { replaceUrl: true });
  }
}
