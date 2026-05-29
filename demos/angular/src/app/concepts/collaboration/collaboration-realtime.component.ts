import { Component, ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor, IndexedDBSyncProvider, HocuspocusSyncProvider, KritzelSyncConfig } from 'kritzel-angular';

@Component({
  selector: 'app-collaboration-realtime',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <span class="label">Real-time Sync</span>
      <span class="status">Connected to Hocuspocus server</span>
    </div>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="collaboration-realtime"
        [wheelEnabled]="false"
        [syncConfig]="syncConfig"
        [loginConfig]="undefined"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
      ></kritzel-editor>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .toolbar { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; }
    .label { font-weight: 600; font-size: 13px; }
    .status { font-size: 12px; color: #4caf50; }
    .editor-wrap { flex: 1; position: relative; }
  `],
})
export class CollaborationRealtimeComponent {
  syncConfig: KritzelSyncConfig = {
    providers: [
      IndexedDBSyncProvider,
      HocuspocusSyncProvider.with({ url: 'wss://your-hocuspocus-server.com' }),
    ],
  };
}
