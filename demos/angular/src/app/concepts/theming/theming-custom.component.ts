import { Component, ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor, KritzelTheme, lightTheme, InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';

const brandTeal = '#00796B';
const brandTealHover = '#00897B';
const brandTealActive = '#00695C';
const brandTealLight = 'rgba(0, 121, 107, 0.08)';
const brandTealMedium = 'rgba(0, 121, 107, 0.15)';

const brandedTealTheme: KritzelTheme = {
  ...lightTheme,
  name: 'branded-teal',
  global: {
    ...lightTheme.global,
    primaryColor: brandTeal,
    primaryHoverColor: brandTealHover,
    focusColor: brandTeal,
    focusRingColor: brandTeal,
  },
  controls: {
    ...lightTheme.controls,
    controlSelectedBackgroundColor: brandTeal,
    controlSelectedColor: '#ffffff',
  },
  selection: {
    ...lightTheme.selection,
    borderColor: brandTeal,
    boxBackgroundColor: brandTealMedium,
    boxBorderColor: 'rgba(0, 121, 107, 0.4)',
    handleColor: '#ffffff',
    handleStrokeColor: brandTeal,
  },
  button: {
    ...lightTheme.button,
    primaryBackgroundColor: brandTeal,
    primaryColor: '#ffffff',
    primaryHoverBackgroundColor: brandTealHover,
    primaryActiveBackgroundColor: brandTealActive,
    textColor: brandTeal,
    textHoverBackgroundColor: brandTealLight,
    textActiveBackgroundColor: brandTealMedium,
  },
};

@Component({
  selector: 'app-theming-custom',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="theming-custom"
      theme="branded-teal"
      [themes]="themes"
      [wheelEnabled]="false"
      [syncConfig]="syncConfig"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `],
})
export class ThemingCustomComponent {
  themes: KritzelTheme[] = [brandedTealTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };
}
