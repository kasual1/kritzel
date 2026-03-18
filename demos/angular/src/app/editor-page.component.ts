import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  ActiveWorkspaceChangeEvent,
  EditorIsReadyEvent,
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
      (isReady)="onIsReady($event)"
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

}
