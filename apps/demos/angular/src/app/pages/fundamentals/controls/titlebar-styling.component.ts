import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  UpdrawEditor,
  UpdrawObjectConfig,
  UpdrawObjectTitlebarConfig,
  UpdrawShape,
  UpdrawTheme,
  UpdrawWorkspace,
  ShapeType,
} from '@updraw/angular-editor';
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

const transparentTitlebarLightTheme: UpdrawTheme = {
  ...angularThemeLight,
  titlebar: { ...angularThemeLight.titlebar, ...transparentTitlebar },
};

const transparentTitlebarDarkTheme: UpdrawTheme = {
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
    new UpdrawShape({ ...frameConfig, name: 'Landing page', translateX: -270, translateY: -110, width: 300, height: 200 }),
    new UpdrawShape({ ...frameConfig, name: 'Pricing', translateX: 70, translateY: -110, width: 200, height: 200 }),
  ];
}

@Component({
  selector: 'app-titlebar-styling',
  imports: [UpdrawEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <updraw-editor
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
    ></updraw-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    updraw-editor { flex: 1; }
  `],
})
export class TitlebarStylingComponent {
  themes: UpdrawTheme[] = [transparentTitlebarLightTheme, transparentTitlebarDarkTheme];

  workspaces = signal([new UpdrawWorkspace({ objects: createFrames() })]);

  readonly objectConfig: UpdrawObjectConfig = {
    hasTitlebar: object => object.__class__ === 'UpdrawShape',
    isRotatable: false,
    isResizable: false,
  };

  readonly objectTitlebar: UpdrawObjectTitlebarConfig = {
    left: [{ id: 'title', type: 'title' }],
    right: [
      { id: 'settings', type: 'button', icon: 'settings', tooltip: 'Settings' },
      { id: 'download', type: 'button', icon: 'download', tooltip: 'Download' },
      { id: 'play', type: 'button', icon: 'play', label: 'PLAY', variant: 'outlined' },
    ],
  };
}
