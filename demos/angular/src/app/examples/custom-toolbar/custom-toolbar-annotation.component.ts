import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelSelectionTool,
  KritzelToolbarControl,
  InMemorySyncProvider,
  KritzelSyncConfig,
} from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-custom-toolbar-annotation',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="custom-toolbar-annotation"
      [wheelEnabled]="false"
      [theme]="'angular-theme'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [controls]="controls"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></kritzel-editor>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class CustomToolbarAnnotationComponent {
  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider]
  };

  controls: KritzelToolbarControl[] = [
    {
      name: 'selection',
      type: 'tool',
      tool: KritzelSelectionTool,
      icon: 'cursor',
    },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      icon: 'pen',
      isDefault: true,
      config: {
        type: 'pen',
        color: { light: '#000000', dark: '#ffffff' },
        size: 24,
        sizes: {
          pen: [24, 16, 8],
        },
        palettes: {
          pen: [
            { light: '#000000', dark: '#ffffff', label: 'Black' },
            { light: '#e53935', dark: '#e53935', label: 'Red' },
            { light: '#1a73e8', dark: '#1a73e8', label: 'Blue' },
          ],
        },
      },
    },
    {
      name: 'config',
      type: 'config',
    },
  ];
}
