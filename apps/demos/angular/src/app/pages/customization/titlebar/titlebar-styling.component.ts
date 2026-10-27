import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  KritzelEditor,
  KritzelObjectConfig,
  KritzelObjectTitlebarConfig,
  KritzelShape,
  KritzelTheme,
  KritzelWorkspace,
  ShapeType,
  darkTheme,
  lightTheme,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';

// `themes` replaces the registry, so each variant spreads the default titlebar tokens and overrides a few.
const transparentTitlebar = {
  backgroundColor: 'transparent',
  hoverBackgroundColor: 'transparent',
  activeBackgroundColor: 'transparent',
  offset: '2px',
  paddingX: '0',
};

const transparentTitlebarLightTheme: KritzelTheme = {
  ...angularThemeLight,
  titlebar: { ...lightTheme.titlebar, ...transparentTitlebar },
};

const transparentTitlebarDarkTheme: KritzelTheme = {
  ...angularThemeDark,
  titlebar: { ...darkTheme.titlebar, ...transparentTitlebar },
};

const frameConfig = {
  shapeType: ShapeType.Rectangle,
  fillColor: { light: '#faf9f5', dark: '#30302e' },
  strokeColor: { light: '#e8e6dc', dark: '#3e3e38' },
  strokeWidth: 2,
};

function createFrames() {
  return [
    new KritzelShape({ ...frameConfig, name: 'Landing page', translateX: -270, translateY: -110, width: 300, height: 200 }),
    new KritzelShape({ ...frameConfig, name: 'Pricing', translateX: 70, translateY: -110, width: 200, height: 200 }),
  ];
}

@Component({
  selector: 'app-titlebar-styling',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
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
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    kritzel-editor { flex: 1; }
  `],
})
export class TitlebarStylingComponent {
  themes: KritzelTheme[] = [transparentTitlebarLightTheme, transparentTitlebarDarkTheme];

  workspaces = signal([new KritzelWorkspace({ objects: createFrames() })]);

  readonly objectConfig: KritzelObjectConfig = {
    hasTitlebar: object => object.__class__ === 'KritzelShape',
    isRotatable: false,
  };

  readonly objectTitlebar: KritzelObjectTitlebarConfig = {
    left: [{ id: 'title', type: 'title' }],
    right: [
      { id: 'settings', type: 'button', icon: 'settings', tooltip: 'Settings' },
      { id: 'download', type: 'button', icon: 'download', tooltip: 'Download' },
      { id: 'play', type: 'button', icon: 'play', label: 'PLAY', variant: 'outlined' },
    ],
  };
}
