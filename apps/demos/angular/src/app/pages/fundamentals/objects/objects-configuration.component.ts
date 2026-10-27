import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  KRITZEL_DEFAULT_OBJECT_TITLEBAR,
  KritzelEditor,
  KritzelObjectConfig,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-objects-configuration',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="control-panel">
      <label class="checkbox-control">
        <input type="checkbox" [checked]="areShapesRotatable()" (change)="setShapesRotatable($event)" />
        <span>Rotate shapes</span>
      </label>
      <label class="checkbox-control">
        <input type="checkbox" [checked]="areShapesResizable()" (change)="setShapesResizable($event)" />
        <span>Resize shapes</span>
      </label>
    </div>
    <kritzel-editor
      editorId="objects-configuration"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      [objectTitlebar]="objectTitlebar"
      [objectConfig]="objectConfig()"
    ></kritzel-editor>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .control-panel { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; }
    .checkbox-control { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #333; cursor: pointer; }
    kritzel-editor { flex: 1; }
  `,
})
export class ObjectsConfigurationComponent {
  readonly areShapesRotatable = signal(false);
  readonly areShapesResizable = signal(false);

  readonly objectTitlebar = KRITZEL_DEFAULT_OBJECT_TITLEBAR;

  // A new object on every change, so that the editor rerenders with the new rules.
  readonly objectConfig = computed<KritzelObjectConfig>(() => {
    const isRotatable = this.areShapesRotatable();
    const isResizable = this.areShapesResizable();

    return {
      hasTitlebar: (object) => object.__class__ === 'KritzelShape',
      isRotatable: (object) => isRotatable || object.__class__ !== 'KritzelShape',
      isResizable: (object) => isResizable || object.__class__ !== 'KritzelShape',
    };
  });

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  setShapesRotatable(event: Event): void {
    this.areShapesRotatable.set((event.target as HTMLInputElement).checked);
  }

  setShapesResizable(event: Event): void {
    this.areShapesResizable.set((event.target as HTMLInputElement).checked);
  }
}
