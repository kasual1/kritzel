import { ChangeDetectionStrategy, Component, OnDestroy, signal, ViewChild } from '@angular/core';

import {
  KritzelDynamicObject,
  KritzelDynamicObjectRendererRegistry,
  KritzelEditor,
  KritzelSyncConfig,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import {
  createGithubStarObjects,
  DEFAULT_STAR_COUNT,
  GITHUB_STAR_RENDERER_KEY,
  GithubStarButtonInstance,
  mountGithubStarButton,
  normalizeGithubStarButtonData,
  STAR_COUNTS,
} from './github-star-button';

interface GithubStarRendererContext {
  object: KritzelDynamicObject;
  container: HTMLElement | null;
  data?: unknown;
}

@Component({
  selector: 'app-github-stars',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="examples-github-stars"
      [theme]="'light'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [workspaces]="workspaces()"
      [loginConfig]="undefined"
      [isPanningEnabled]="true"
      [isZoomingEnabled]="true"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></kritzel-editor>

    <div class="count-switcher" role="group" aria-label="Number of star buttons">
      <span>Buttons</span>
      @for (count of starCounts; track count) {
        <button
          type="button"
          [class.active]="count === starCount()"
          [attr.aria-pressed]="count === starCount()"
          [disabled]="isBusy()"
          (click)="changeStarCount(count)"
        >
          {{ count.toLocaleString('en-US') }}
        </button>
      }
    </div>
  `,
  styles: [`
    :host { position: relative; display: block; height: 100%; font-family: Roboto, sans-serif; }
    kritzel-editor { display: block; width: 100%; height: 100%; }
    .count-switcher { position: absolute; top: 12px; right: 12px; z-index: 10; display: flex; align-items: center; gap: 6px; padding: 6px 8px; border: 1px solid #ebebeb; border-radius: 8px; background: #ffffff; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); color: #333333; font-size: 13px; }
    .count-switcher button { padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 6px; background: #ffffff; color: #333333; font-size: 13px; font-family: inherit; cursor: pointer; }
    .count-switcher button.active { border-color: #dd0031; background: #dd0031; color: #ffffff; }
  `],
})
export class GithubStarsComponent implements OnDestroy {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;
  private readonly mountedButtons = new Map<string, GithubStarButtonInstance>();

  readonly starCounts = STAR_COUNTS;
  readonly starCount = signal(DEFAULT_STAR_COUNT);
  readonly isBusy = signal(false);

  themes = [angularThemeLight, angularThemeDark];
  syncConfig: KritzelSyncConfig = { providers: [] };
  workspaces = signal([
    new KritzelWorkspace({ objects: createGithubStarObjects(DEFAULT_STAR_COUNT) }),
  ]);

  constructor() {
    KritzelDynamicObjectRendererRegistry.register(GITHUB_STAR_RENDERER_KEY, {
      onMount: ({ object, container, data }: GithubStarRendererContext) => {
        if (!container) {
          return;
        }

        this.destroyButton(object.id, container);
        this.mountedButtons.set(object.id, mountGithubStarButton(container, normalizeGithubStarButtonData(data)));
      },
      onSerialize: ({ object, data }: GithubStarRendererContext) => {
        return this.mountedButtons.get(object.id)?.getData() ?? normalizeGithubStarButtonData(data);
      },
      onUnmount: ({ object, container, data }: GithubStarRendererContext) => {
        const state = this.mountedButtons.get(object.id)?.getData() ?? normalizeGithubStarButtonData(data);
        this.destroyButton(object.id, container);

        return state;
      },
    });
  }

  async changeStarCount(count: number): Promise<void> {
    if (this.isBusy() || count === this.starCount()) {
      return;
    }

    const editor = this.editor;
    this.isBusy.set(true);
    try {
      await editor.clearSelection();
      await editor.removeObjects(await editor.getAllObjects());
      await editor.addObjects(createGithubStarObjects(count));
      this.starCount.set(count);
    } finally {
      this.isBusy.set(false);
    }
  }

  private destroyButton(objectId: string, container: HTMLElement | null): void {
    this.mountedButtons.get(objectId)?.destroy();
    this.mountedButtons.delete(objectId);

    if (container) {
      container.innerHTML = '';
    }
  }

  ngOnDestroy(): void {
    this.mountedButtons.forEach((button) => button.destroy());
    this.mountedButtons.clear();

    KritzelDynamicObjectRendererRegistry.unregister(GITHUB_STAR_RENDERER_KEY);
  }
}
