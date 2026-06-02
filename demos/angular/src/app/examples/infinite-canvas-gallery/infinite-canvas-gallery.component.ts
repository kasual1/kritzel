import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
} from '@angular/core';
import {
  KritzelEditor,
  InMemorySyncProvider,
  KritzelSyncConfig,
  KritzelImage,
  EditorIsReadyEvent,
  KritzelShape,
  ShapeType,
} from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

const SMALL_SIZE = 200;
const LARGE_SIZE = 1000;

@Component({
  selector: 'app-infinite-canvas-gallery',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="canvas-wrapper">
      <kritzel-editor
        editorId="infinite-canvas-gallery"
        [theme]="'angular-theme'"
        [themes]="themes"
        [syncConfig]="syncConfig"
        [loginConfig]="undefined"
        [isMoreMenuVisible]="true"
        [isWorkspaceManagerVisible]="false"
        [isObjectDistanceFadingActive]="true"
        (isReady)="onIsReady($event)"
      ></kritzel-editor>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: Roboto, sans-serif;
      background: #f5f5f0;
    }

    .gallery-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 24px;
      background: #ffffff;
      border-bottom: 1px solid #e8e8e8;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: rgba(221, 0, 48, 0.1);
      color: #dd0031;
      padding: 2px 8px;
      border-radius: 99px;
    }

    .title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .hint {
      margin: 0;
      font-size: 13px;
      color: #888888;
    }

    .canvas-wrapper {
      flex: 1;
      position: relative;
    }

    kritzel-editor {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class InfiniteCanvasGalleryComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  async onIsReady(_event: CustomEvent<EditorIsReadyEvent>) {
    const existing = await this.editor.getAllObjects();
    if (existing.length > 0) return;

    const image1 = new KritzelImage({
      src: 'https://picsum.photos/id/237/200/300',
      translateX: -(LARGE_SIZE / 2 / 2),
      translateY: -(LARGE_SIZE / 2 / 2),
      width: LARGE_SIZE,
      height: LARGE_SIZE,
      scale: 2,
    });

    const image2 = new KritzelImage({
      src: 'https://picsum.photos/id/238/200/300',
      translateX: -(SMALL_SIZE / 10 / 2),
      translateY: -(SMALL_SIZE / 10 / 2),
      width: SMALL_SIZE,
      height: SMALL_SIZE,
      scale: 10,
    });

    await this.editor.addObjects([image2, image1]);
  }
}
