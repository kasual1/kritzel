import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  UpmadeEditor,
  UpmadeObjectConfig,
  UpmadeObjectTitlebarConfig,
  UpmadeShape,
  UpmadeTheme,
  UpmadeWorkspace,
  ShapeType,
} from '@upmade/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';

// `themes` replaces the registry, so each variant spreads the app theme's titlebar tokens and overrides a few.
const transparentTitlebar = {
  backgroundColor: 'transparent',
  hoverBackgroundColor: 'transparent',
  activeBackgroundColor: 'transparent',
  offset: '2px',
  paddingX: '0',
};

const transparentTitlebarLightTheme: UpmadeTheme = {
  ...angularThemeLight,
  titlebar: { ...angularThemeLight.titlebar, ...transparentTitlebar },
};

const transparentTitlebarDarkTheme: UpmadeTheme = {
  ...angularThemeDark,
  titlebar: { ...angularThemeDark.titlebar, ...transparentTitlebar },
};

const frameConfig = {
  shapeType: ShapeType.Rectangle,
  fillColor: { light: '#f5f6f7', dark: '#2b2c2f' },
  strokeColor: { light: '#f5f6f7', dark: '#2b2c2f' },
  strokeWidth: 2,
};

function createFrames() {
  return [
    new UpmadeShape({ ...frameConfig, name: 'Landing page', translateX: -270, translateY: -110, width: 300, height: 200 }),
    new UpmadeShape({ ...frameConfig, name: 'Pricing', translateX: 70, translateY: -110, width: 200, height: 200 }),
  ];
}

@Component({
  selector: 'app-titlebar-styling',
  imports: [UpmadeEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <upmade-editor
      editorId="titlebar-styling"
      theme="light"
      [themes]="themes"
      [workspaces]="workspaces()"
      [objectConfig]="objectConfig"
      [objectTitlebar]="objectTitlebar"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="true"
      [isWorkspaceManagerVisible]="false"
    ></upmade-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    upmade-editor { flex: 1; }
  `],
})
export class TitlebarStylingComponent {
  themes: UpmadeTheme[] = [transparentTitlebarLightTheme, transparentTitlebarDarkTheme];

  workspaces = signal([new UpmadeWorkspace({ objects: createFrames() })]);

  readonly objectConfig: UpmadeObjectConfig = {
    hasTitlebar: object => object.__class__ === 'UpmadeShape',
    isRotatable: false,
    isResizable: false,
  };

  readonly objectTitlebar: UpmadeObjectTitlebarConfig = {
    left: [{ id: 'title', type: 'title' }],
    right: [
      { id: 'settings', type: 'button', icon: 'settings', tooltip: 'Settings' },
      { id: 'download', type: 'button', icon: 'download', tooltip: 'Download' },
      { id: 'play', type: 'button', icon: 'play', label: 'PLAY', variant: 'outlined' },
    ],
  };
}
