import { Component, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import {
  KritzelEditor,
  KritzelTheme, KritzelThemeManager, lightTheme, darkTheme, ThemeName,
  KritzelBrushTool, KritzelSelectionTool, KritzelTextTool,
  ThemeAwareColor, KritzelToolbarControl,
  DEFAULT_BRUSH_CONFIG, DEFAULT_TEXT_CONFIG,
  InMemorySyncProvider, KritzelSyncConfig,
} from 'kritzel-angular';

const brandPurple = '#6200EE';
const brandPurpleHover = '#7c2fff';
const brandPurpleActive = '#4b00b5';
const brandPurpleLight = 'rgba(98, 0, 238, 0.08)';
const brandPurpleMedium = 'rgba(98, 0, 238, 0.15)';

const brandPurpleDark = '#BB86FC';
const brandPurpleDarkHover = '#ce9ffc';
const brandPurpleDarkActive = '#9c5eda';
const brandPurpleDarkLight = 'rgba(187, 134, 252, 0.12)';
const brandPurpleDarkMedium = 'rgba(187, 134, 252, 0.2)';

const brandedLightTheme: KritzelTheme = {
  ...lightTheme,
  name: 'branded-light',

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

const brandedDarkTheme: KritzelTheme = {
  ...darkTheme,
  name: 'branded-dark',

  global: {
    ...darkTheme.global,
    borderColor: '#2d1b69',
    dividerColor: '#2d1b69',
    focusColor: brandPurpleDark,
    focusRingColor: brandPurpleDark,
    scrollbarThumbColor: '#3d2680',
    textPrimary: '#EDE7F6',
    textSecondary: '#D1C4E9',
  },

  pillTabs: {
    ...darkTheme.pillTabs,
    background: '#1a0d40',
    tabBackgroundHover: brandPurpleDarkLight,
    tabBackgroundSelected: '#12005e',
    tabShadowSelected: '0 1px 3px rgba(0, 0, 0, 0.4)',
    tabTextColor: '#9575CD',
    tabTextColorSelected: brandPurpleDark,
  },

  textInput: {
    ...darkTheme.textInput,
    background: '#0d0033',
    borderColor: '#3d2680',
    focusBorderColor: brandPurpleDark,
    hoverBorderColor: '#5c3d99',
    labelColor: '#D1C4E9',
    selectionBackground: brandPurpleDark,
    selectionColor: '#000000',
    suffixBackground: '#1a0d40',
    suffixColor: '#9575CD',
    textColor: '#EDE7F6',
  },

  selection: {
    ...darkTheme.selection,
    borderColor: brandPurpleDark,
    boxBackgroundColor: 'rgba(187, 134, 252, 0.2)',
    boxBorderColor: 'rgba(187, 134, 252, 0.5)',
    handleColor: '#12005e',
    handleStrokeColor: brandPurpleDark,
  },

  button: {
    primaryBackgroundColor: brandPurpleDark,
    primaryColor: '#000000',
    primaryHoverBackgroundColor: brandPurpleDarkHover,
    primaryActiveBackgroundColor: brandPurpleDarkActive,
    secondaryBackgroundColor: '#1a0d40',
    secondaryColor: brandPurpleDark,
    secondaryHoverBackgroundColor: '#2d1b69',
    secondaryActiveBackgroundColor: '#3d2680',
    textColor: brandPurpleDark,
    textHoverBackgroundColor: brandPurpleDarkLight,
    textActiveBackgroundColor: brandPurpleDarkMedium,
  },

  checkerboard: {
    colorDark: '#2d1b69',
    colorLight: '#1a0d40',
  },

  backToContent: {
    ...darkTheme.backToContent,
    activeBackgroundColor: brandPurpleDarkMedium,
    backgroundColor: '#1a0d40',
    border: '1px solid #2d1b69',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.4)',
    color: '#EDE7F6',
    hoverBackgroundColor: brandPurpleDarkLight,
  },

  colorPalette: {
    ...darkTheme.colorPalette,
    circleBorderColor: '#3d2680',
    hoverBackgroundColor: '#2d1b69',
    selectedBackgroundColor: '#3d2680',
  },

  contextMenu: {
    ...darkTheme.contextMenu,
    backgroundColor: '#1a0d40',
    border: '1px solid #2d1b69',
    boxShadow: '0 1px 8px rgba(0, 0, 0, 0.5)',
    dividerColor: 'rgba(187, 134, 252, 0.15)',
    itemActiveBackgroundColor: brandPurpleDarkMedium,
    itemColor: '#EDE7F6',
    itemDisabledColor: '#5c3d99',
    itemHoverBackgroundColor: brandPurpleDarkLight,
  },

  controls: {
    ...darkTheme.controls,
    backgroundColor: '#1a0d40',
    border: '1px solid #2d1b69',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.4)',
    controlActiveBackgroundColor: brandPurpleDarkMedium,
    controlColor: '#EDE7F6',
    controlHoverBackgroundColor: brandPurpleDarkLight,
    controlSelectedBackgroundColor: brandPurpleDark,
    controlSelectedColor: '#000000',
  },

  currentUserDialog: {
    emailColor: '#9575CD',
    nameColor: '#EDE7F6',
  },

  dialog: {
    ...darkTheme.dialog,
    backgroundColor: '#1a0d40',
    border: '1px solid #2d1b69',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
    closeButtonActiveBackground: brandPurpleDarkMedium,
    closeButtonColor: '#D1C4E9',
    closeButtonHoverBackground: brandPurpleDarkLight,
    closeButtonHoverColor: brandPurpleDark,
    footerBorder: '1px solid #2d1b69',
    headerBorder: '1px solid #2d1b69',
    titleColor: '#EDE7F6',
  },

  loginDialog: {
    ...darkTheme.loginDialog,
    buttonActiveBackground: '#3d2680',
    buttonBackground: '#1a0d40',
    buttonBorderColor: '#2d1b69',
    buttonHoverBackground: '#2d1b69',
    buttonHoverBorderColor: '#3d2680',
    buttonTextColor: '#D1C4E9',
    spinnerActiveColor: brandPurpleDark,
    spinnerColor: '#3d2680',
    subtitleColor: '#9575CD',
  },

  dropdown: {
    ...darkTheme.dropdown,
    accentColor: brandPurpleDark,
    background: '#0d0033',
    borderColor: '#3d2680',
    hoverBorderColor: '#5c3d99',
    hoverBackgroundColor: '#2d1b69',
    selectedBackgroundColor: 'rgba(187, 134, 252, 0.15)',
    textColor: '#EDE7F6',
  },

  engine: {
    ...darkTheme.engine,
    backgroundColor: '#12005e',
    loadingOverlayBackground: 'rgba(18, 0, 94, 0.9)',
    loadingOverlayColor: '#D1C4E9',
    loadingOverlaySpinnerActiveColor: brandPurpleDark,
    loadingOverlaySpinnerColor: '#3d2680',
  },

  snap: {
    indicatorFill: 'rgba(187, 134, 252, 0.25)',
    indicatorStroke: brandPurpleDark,
    lineStroke: 'rgba(187, 134, 252, 0.3)',
  },

  fontSize: {
    hoverBackgroundColor: '#2d1b69',
    selectedBackgroundColor: '#3d2680',
    textColor: '#EDE7F6',
  },

  lineEndings: {
    hoverBackgroundColor: '#2d1b69',
    labelColor: '#9575CD',
    optionBackground: '#1a0d40',
    selectedBackgroundColor: '#3d2680',
  },

  masterDetail: {
    ...darkTheme.masterDetail,
    backButtonColor: '#D1C4E9',
    backgroundColor: '#1a0d40',
    detailBackgroundColor: '#1a0d40',
    detailFocusOutline: `2px solid ${brandPurpleDark}`,
    menuBackgroundColor: '#1a0d40',
    menuBorderRight: '1px solid #2d1b69',
    menuItemActiveBackgroundColor: brandPurpleDarkMedium,
    menuItemChevronColor: '#5c3d99',
    menuItemColor: '#D1C4E9',
    menuItemDisabledColor: '#5c3d99',
    menuItemFocusOutline: `2px solid ${brandPurpleDark}`,
    menuItemHoverBackgroundColor: brandPurpleDarkLight,
    menuItemSelectedBackgroundColor: brandPurpleDark,
    menuItemSelectedColor: '#000000',
    menuItemSelectedHoverBackgroundColor: brandPurpleDarkHover,
  },

  menu: {
    ...darkTheme.menu,
    backgroundColor: '#1a0d40',
    border: '1px solid #2d1b69',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.4)',
    itemButtonHoverBackgroundColor: brandPurpleDarkLight,
    itemChildOpenBackgroundColor: 'rgba(187, 134, 252, 0.06)',
    itemColor: '#EDE7F6',
    itemEditingBackgroundColor: '#2d1b69',
    itemInputBorder: `1px solid ${brandPurpleDark}`,
    itemInputBorderColorOnSelected: '#000000',
    itemInputCaretColor: brandPurpleDark,
    itemInputCaretColorOnSelected: '#000000',
    itemInputSelectionColor: brandPurpleDark,
    itemInputSelectionColorOnSelected: 'rgba(0, 0, 0, 0.35)',
    itemInputSelectionTextColor: '#000000',
    itemInputSelectionTextColorOnSelected: '#000000',
    itemOverlayBackgroundColor: brandPurpleDarkLight,
    itemSelectedBackgroundColor: brandPurpleDark,
    itemSelectedColor: '#000000',
  },

  moreMenu: {
    ...darkTheme.moreMenu,
    backgroundColor: '#1a0d40',
    border: '1px solid #2d1b69',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.4)',
    buttonActiveBackgroundColor: brandPurpleDarkMedium,
    buttonColor: '#EDE7F6',
    buttonHoverBackgroundColor: brandPurpleDarkLight,
  },

  numericInput: {
    ...darkTheme.numericInput,
    borderColor: '#3d2680',
    focusBorderColor: brandPurpleDark,
    hoverBorderColor: '#5c3d99',
    inputBackground: '#0d0033',
    labelColor: '#9575CD',
    selectionBackground: brandPurpleDark,
    selectionColor: '#000000',
    spinnerActiveBackground: brandPurpleDarkMedium,
    spinnerColor: '#D1C4E9',
    spinnerHoverBackground: brandPurpleDarkLight,
    textColor: '#EDE7F6',
  },

  opacitySlider: {
    activeColor: brandPurpleDark,
    thumbBorderColor: brandPurpleDark,
    thumbColor: '#12005e',
    trackColor: '#3d2680',
  },

  settings: {
    contentHeadingColor: '#EDE7F6',
    contentTextColor: '#D1C4E9',
    descriptionColor: '#9575CD',
    labelColor: '#D1C4E9',
    shortcutItemBg: '#1a0d40',
    shortcutKeyBg: '#12005e',
    shortcutKeyBorder: '#2d1b69',
    shortcutKeyColor: '#D1C4E9',
  },

  shapeFill: {
    hoverBackgroundColor: '#2d1b69',
    optionBackground: '#1a0d40',
    selectedBackgroundColor: '#3d2680',
  },

  shareDialog: {
    ...darkTheme.shareDialog,
    borderColor: '#2d1b69',
    copyButtonBackground: '#1a0d40',
    copyButtonColor: '#D1C4E9',
    copyButtonHoverBackground: '#2d1b69',
    copyButtonHoverColor: brandPurpleDark,
    copySuccessBackground: '#1b5e20',
    copySuccessColor: '#ffffff',
    descriptionColor: '#9575CD',
    inputBackground: '#0d0033',
    inputBorderColor: '#2d1b69',
    inputTextColor: '#EDE7F6',
    labelColor: '#D1C4E9',
    selectionColor: brandPurpleDark,
  },

  slideToggle: {
    thumbColor: '#12005e',
    thumbSize: '18px',
    trackCheckedColor: brandPurpleDark,
    trackColor: '#3d2680',
  },

  splitButton: {
    ...darkTheme.splitButton,
    backgroundColor: '#1a0d40',
    border: '1px solid #2d1b69',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.4)',
    color: '#EDE7F6',
    dividerBackgroundColor: '#2d1b69',
    hoverBackgroundColor: brandPurpleDarkLight,
  },

  strokeSize: {
    hoverBackgroundColor: '#2d1b69',
    selectedBackgroundColor: '#3d2680',
  },

  tooltip: {
    backgroundColor: '#1a0d40',
    border: '1px solid #2d1b69',
    boxShadow: '0 1px 8px rgba(0, 0, 0, 0.5)',
    color: '#EDE7F6',
  },

  utilityPanel: {
    backgroundColor: '#2d1b69',
    buttonColor: '#D1C4E9',
    buttonHoverBackgroundColor: brandPurpleDarkLight,
    separatorColor: 'rgba(187, 134, 252, 0.15)',
  },
};

const BRAND_PALETTE: ThemeAwareColor[] = [
  { light: '#6200EE', dark: '#BB86FC', label: 'Brand' },
  { light: '#03DAC6', dark: '#03DAC6', label: 'Accent' },
  { light: '#000000', dark: '#ffffff', label: 'Foreground' },
  { light: '#ffffff', dark: '#12005e', label: 'Background' },
];

const brandControls: KritzelToolbarControl[] = [
  { name: 'selection', type: 'tool', isDefault: true, tool: KritzelSelectionTool, icon: 'cursor' },
  {
    name: 'brush',
    type: 'tool',
    tool: KritzelBrushTool,
    icon: 'pen',
    config: {
      ...DEFAULT_BRUSH_CONFIG,
      color: { light: '#6200EE', dark: '#BB86FC', label: 'Brand' },
      palettes: { pen: BRAND_PALETTE },
    },
  },
  {
    name: 'text',
    type: 'tool',
    tool: KritzelTextTool,
    icon: 'type',
    config: {
      ...DEFAULT_TEXT_CONFIG,
      color: { light: '#1a0050', dark: '#EDE7F6', label: 'Text' },
      palette: BRAND_PALETTE,
    },
  },
  { name: 'config', type: 'config' },
];

@Component({
  selector: 'app-theming-host-sync',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [attr.data-theme]="activeTheme()">
      Current theme: {{ activeTheme() }}
    </div>
    <kritzel-editor
      editorId="theming-host-sync"
      [wheelEnabled]="false"
      [controls]="brandControls"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [theme]="activeTheme()"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (themeChange)="onThemeChange($event)"
    ></kritzel-editor>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    div {
      padding: 8px;
    }
    kritzel-editor {
      flex: 1;
    }
  `],
})
export class ThemingHostSyncComponent implements OnInit {
  themes = [brandedLightTheme, brandedDarkTheme];
  readonly brandControls = brandControls;

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider]
  };

  activeTheme = signal<ThemeName>('branded-light');

  ngOnInit(): void {
    const stored = KritzelThemeManager.getStoredTheme();
    if (stored === 'branded-light' || stored === 'branded-dark') {
      this.activeTheme.set(stored);
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      this.activeTheme.set('branded-light');
      document.documentElement.setAttribute('data-theme', 'branded-light');
    }
  }

  onThemeChange(event: CustomEvent<ThemeName>): void {
    this.activeTheme.set(event.detail);
    document.documentElement.setAttribute('data-theme', event.detail);
  }
}

