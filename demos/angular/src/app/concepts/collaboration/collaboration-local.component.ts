import { Component, ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor, IndexedDBSyncProvider, BroadcastSyncProvider, KritzelSyncConfig } from 'kritzel-angular';

@Component({
  selector: 'app-collaboration-local',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <span class="label">Local Providers:</span>
      <label><input type="checkbox" [checked]="useIndexedDB" (change)="toggleIndexedDB()"> IndexedDB</label>
      <label><input type="checkbox" [checked]="useBroadcast" (change)="toggleBroadcast()"> BroadcastChannel</label>
    </div>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="collaboration-local"
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
    label { display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: pointer; }
    .editor-wrap { flex: 1; position: relative; }
  `],
})
export class CollaborationLocalComponent {
  useIndexedDB = true;
  useBroadcast = true;

  syncConfig: KritzelSyncConfig = this.buildConfig();

  toggleIndexedDB() {
    this.useIndexedDB = !this.useIndexedDB;
    this.syncConfig = this.buildConfig();
  }

  toggleBroadcast() {
    this.useBroadcast = !this.useBroadcast;
    this.syncConfig = this.buildConfig();
  }

  private buildConfig(): KritzelSyncConfig {
    const providers: KritzelSyncConfig['providers'] = [];
    if (this.useIndexedDB) providers.push(IndexedDBSyncProvider);
    if (this.useBroadcast) providers.push(BroadcastSyncProvider);
    return { providers };
  }
}
