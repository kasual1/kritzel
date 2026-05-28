import {
  Component,
  ChangeDetectionStrategy,
} from '@angular/core';
import { KritzelEditor, KritzelTheme, lightTheme, InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';

const brandPurple = '#6200EE';
const brandPurpleHover = '#7c2fff';
const brandPurpleActive = '#4b00b5';
const brandPurpleLight = 'rgba(98, 0, 238, 0.08)';
const brandPurpleMedium = 'rgba(98, 0, 238, 0.15)';

const customLightTheme: KritzelTheme = {
  ...lightTheme,
  name: 'custom-light',

  global: {
    ...lightTheme.global,
    borderColor: '#e8e0f0',
    dividerColor: '#e0d6ed',
    focusColor: brandPurple,
    focusRingColor: brandPurple,
    scrollbarThumbColor: '#d6c8e8',
    textPrimary: '#1a0050',
    textSecondary: '#3d1e78',
  },

  pillTabs: {
    ...lightTheme.pillTabs,
    background: '#f3edf9',
    tabBackgroundHover: brandPurpleLight,
    tabBackgroundSelected: '#ffffff',
    tabShadowSelected: '0 1px 3px rgba(98, 0, 238, 0.12)',
    tabTextColor: '#5c4580',
    tabTextColorSelected: brandPurple,
  },

  textInput: {
    ...lightTheme.textInput,
    borderColor: '#d6c8e8',
    focusBorderColor: brandPurple,
    hoverBorderColor: '#b89edb',
    labelColor: '#3d1e78',
    selectionBackground: brandPurple,
    selectionColor: '#ffffff',
    suffixBackground: '#f3edf9',
    suffixColor: '#5c4580',
    textColor: '#1a0050',
  },

  selection: {
    ...lightTheme.selection,
    borderColor: brandPurple,
    boxBackgroundColor: 'rgba(98, 0, 238, 0.15)',
    boxBorderColor: 'rgba(98, 0, 238, 0.4)',
    handleColor: '#ffffff',
    handleStrokeColor: brandPurple,
  },

  button: {
    primaryBackgroundColor: brandPurple,
    primaryColor: '#ffffff',
    primaryHoverBackgroundColor: brandPurpleHover,
    primaryActiveBackgroundColor: brandPurpleActive,
    secondaryBackgroundColor: '#f3edf9',
    secondaryColor: brandPurple,
    secondaryHoverBackgroundColor: '#ede4f7',
    secondaryActiveBackgroundColor: '#e0d6ed',
    textColor: brandPurple,
    textHoverBackgroundColor: brandPurpleLight,
    textActiveBackgroundColor: brandPurpleMedium,
  },

  checkerboard: {
    colorDark: '#e0d6ed',
    colorLight: '#ffffff',
  },

  backToContent: {
    ...lightTheme.backToContent,
    activeBackgroundColor: brandPurpleMedium,
    backgroundColor: '#ffffff',
    border: '1px solid #e8e0f0',
    boxShadow: '0 0 3px rgba(98, 0, 238, 0.1)',
    color: '#1a0050',
    hoverBackgroundColor: brandPurpleLight,
  },

  colorPalette: {
    ...lightTheme.colorPalette,
    circleBorderColor: '#d6c8e8',
    hoverBackgroundColor: '#f3edf9',
    selectedBackgroundColor: '#ede4f7',
  },

  contextMenu: {
    ...lightTheme.contextMenu,
    backgroundColor: '#ffffff',
    border: '1px solid #e8e0f0',
    boxShadow: '0 1px 6px rgba(98, 0, 238, 0.12)',
    dividerColor: 'rgba(98, 0, 238, 0.1)',
    itemActiveBackgroundColor: brandPurpleMedium,
    itemColor: '#1a0050',
    itemDisabledColor: '#b89edb',
    itemHoverBackgroundColor: brandPurpleLight,
  },

  controls: {
    ...lightTheme.controls,
    backgroundColor: '#ffffff',
    border: '1px solid #e8e0f0',
    boxShadow: '0 0 3px rgba(98, 0, 238, 0.1)',
    controlActiveBackgroundColor: brandPurpleMedium,
    controlColor: '#1a0050',
    controlHoverBackgroundColor: brandPurpleLight,
    controlSelectedBackgroundColor: brandPurple,
    controlSelectedColor: '#ffffff',
  },

  currentUserDialog: {
    emailColor: '#5c4580',
    nameColor: '#1a0050',
  },

  dialog: {
    ...lightTheme.dialog,
    backgroundColor: '#ffffff',
    border: '1px solid #e8e0f0',
    boxShadow: '0 4px 24px rgba(98, 0, 238, 0.15)',
    closeButtonActiveBackground: brandPurpleMedium,
    closeButtonColor: '#3d1e78',
    closeButtonHoverBackground: brandPurpleLight,
    closeButtonHoverColor: brandPurple,
    footerBorder: '1px solid #e8e0f0',
    headerBorder: '1px solid #e8e0f0',
    titleColor: '#1a0050',
  },

  loginDialog: {
    ...lightTheme.loginDialog,
    buttonActiveBackground: '#ede4f7',
    buttonBackground: '#ffffff',
    buttonBorderColor: '#e8e0f0',
    buttonHoverBackground: '#f3edf9',
    buttonHoverBorderColor: '#d6c8e8',
    buttonTextColor: '#3d1e78',
    spinnerActiveColor: brandPurple,
    spinnerColor: '#d6c8e8',
    subtitleColor: '#5c4580',
  },

  dropdown: {
    ...lightTheme.dropdown,
    accentColor: brandPurple,
    background: '#ffffff',
    borderColor: '#d6c8e8',
    hoverBorderColor: '#b89edb',
    hoverBackgroundColor: '#f3edf9',
    selectedBackgroundColor: 'rgba(98, 0, 238, 0.1)',
    textColor: '#1a0050',
  },

  engine: {
    ...lightTheme.engine,
    backgroundColor: '#faf7ff',
    loadingOverlayBackground: 'rgba(250, 247, 255, 0.9)',
    loadingOverlayColor: '#3d1e78',
    loadingOverlaySpinnerActiveColor: brandPurple,
    loadingOverlaySpinnerColor: '#d6c8e8',
  },

  snap: {
    indicatorFill: 'rgba(98, 0, 238, 0.2)',
    indicatorStroke: brandPurple,
    lineStroke: 'rgba(98, 0, 238, 0.25)',
  },

  fontSize: {
    hoverBackgroundColor: '#f3edf9',
    selectedBackgroundColor: '#ede4f7',
    textColor: '#1a0050',
  },

  lineEndings: {
    hoverBackgroundColor: '#f3edf9',
    labelColor: '#5c4580',
    optionBackground: '#ffffff',
    selectedBackgroundColor: '#ede4f7',
  },

  masterDetail: {
    ...lightTheme.masterDetail,
    backButtonColor: '#3d1e78',
    backgroundColor: '#ffffff',
    detailBackgroundColor: '#ffffff',
    detailFocusOutline: `2px solid ${brandPurple}`,
    menuBackgroundColor: '#ffffff',
    menuBorderRight: '1px solid #e8e0f0',
    menuItemActiveBackgroundColor: brandPurpleMedium,
    menuItemChevronColor: '#b89edb',
    menuItemColor: '#3d1e78',
    menuItemDisabledColor: '#b89edb',
    menuItemFocusOutline: `2px solid ${brandPurple}`,
    menuItemHoverBackgroundColor: brandPurpleLight,
    menuItemSelectedBackgroundColor: brandPurple,
    menuItemSelectedColor: '#ffffff',
    menuItemSelectedHoverBackgroundColor: brandPurpleHover,
  },

  menu: {
    ...lightTheme.menu,
    backgroundColor: '#ffffff',
    border: '1px solid #e8e0f0',
    boxShadow: '0 0 3px rgba(98, 0, 238, 0.1)',
    itemButtonHoverBackgroundColor: brandPurpleLight,
    itemChildOpenBackgroundColor: 'rgba(98, 0, 238, 0.03)',
    itemColor: '#1a0050',
    itemEditingBackgroundColor: '#f3edf9',
    itemInputBorder: `1px solid ${brandPurple}`,
    itemInputBorderColorOnSelected: '#ffffff',
    itemInputCaretColor: brandPurple,
    itemInputCaretColorOnSelected: '#ffffff',
    itemInputSelectionColor: brandPurple,
    itemInputSelectionColorOnSelected: 'rgba(255, 255, 255, 0.55)',
    itemInputSelectionTextColor: '#ffffff',
    itemInputSelectionTextColorOnSelected: '#ffffff',
    itemOverlayBackgroundColor: brandPurpleLight,
    itemSelectedBackgroundColor: brandPurple,
    itemSelectedColor: '#ffffff',
  },

  moreMenu: {
    ...lightTheme.moreMenu,
    backgroundColor: '#ffffff',
    border: '1px solid #e8e0f0',
    boxShadow: '0 0 3px rgba(98, 0, 238, 0.1)',
    buttonActiveBackgroundColor: brandPurpleMedium,
    buttonColor: '#1a0050',
    buttonHoverBackgroundColor: brandPurpleLight,
  },

  numericInput: {
    ...lightTheme.numericInput,
    borderColor: '#d6c8e8',
    focusBorderColor: brandPurple,
    hoverBorderColor: '#b89edb',
    inputBackground: '#ffffff',
    labelColor: '#5c4580',
    selectionBackground: brandPurple,
    selectionColor: '#ffffff',
    spinnerActiveBackground: brandPurpleMedium,
    spinnerColor: '#3d1e78',
    spinnerHoverBackground: brandPurpleLight,
    textColor: '#1a0050',
  },

  opacitySlider: {
    activeColor: brandPurple,
    thumbBorderColor: brandPurple,
    thumbColor: '#ffffff',
    trackColor: '#e0d6ed',
  },

  settings: {
    contentHeadingColor: '#1a0050',
    contentTextColor: '#3d1e78',
    descriptionColor: '#5c4580',
    labelColor: '#3d1e78',
    shortcutItemBg: '#f9f5ff',
    shortcutKeyBg: '#ffffff',
    shortcutKeyBorder: '#e8e0f0',
    shortcutKeyColor: '#3d1e78',
  },

  shapeFill: {
    hoverBackgroundColor: '#f3edf9',
    optionBackground: '#ffffff',
    selectedBackgroundColor: '#ede4f7',
  },

  shareDialog: {
    ...lightTheme.shareDialog,
    borderColor: '#e8e0f0',
    copyButtonBackground: '#ffffff',
    copyButtonColor: '#5c4580',
    copyButtonHoverBackground: '#f3edf9',
    copyButtonHoverColor: brandPurple,
    copySuccessBackground: '#e8f5e9',
    copySuccessColor: '#2e7d32',
    descriptionColor: '#5c4580',
    inputBackground: '#f9f5ff',
    inputBorderColor: '#e8e0f0',
    inputTextColor: '#1a0050',
    labelColor: '#3d1e78',
    selectionColor: '#ede4f7',
  },

  slideToggle: {
    thumbColor: '#ffffff',
    thumbSize: '18px',
    trackCheckedColor: brandPurple,
    trackColor: '#d6c8e8',
  },

  splitButton: {
    ...lightTheme.splitButton,
    backgroundColor: '#ffffff',
    border: '1px solid #e8e0f0',
    boxShadow: '0 0 3px rgba(98, 0, 238, 0.1)',
    color: '#1a0050',
    dividerBackgroundColor: '#e8e0f0',
    hoverBackgroundColor: brandPurpleLight,
  },

  strokeSize: {
    hoverBackgroundColor: '#f3edf9',
    selectedBackgroundColor: '#ede4f7',
  },

  tooltip: {
    backgroundColor: '#ffffff',
    border: '1px solid #e8e0f0',
    boxShadow: '0 1px 6px rgba(98, 0, 238, 0.12)',
    color: '#1a0050',
  },

  utilityPanel: {
    backgroundColor: '#ede4f7',
    buttonColor: '#3d1e78',
    buttonHoverBackgroundColor: brandPurpleLight,
    separatorColor: 'rgba(98, 0, 238, 0.1)',
  },
};

@Component({
  selector: 'app-theming-full-light',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="theming-full-light"
      [wheelEnabled]="false"
      [themes]="themes"
      [syncConfig]="syncConfig"
      theme="custom-light"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></kritzel-editor>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `],
})
export class ThemingFullLightComponent {
  themes = [customLightTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider]
  };
}
