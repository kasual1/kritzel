import { KritzelTheme } from '../interfaces/theme.interface';

/**
 * Light theme preset - the default theme
 */
export const lightTheme: KritzelTheme = {
  name: 'light',

  global: {
    pointerCursor: 'pointer',
    focusRingColor: 'rgba(0, 122, 255, 0.3)',
    focusColor: '#007acc',
    iconColor: 'currentColor',
    dividerColor: '#e0e0e0',
    selectionBorderColor: '#007AFF',
  },

  engine: {
    backgroundColor: '#ffffff',
  },

  controls: {
    gap: '8px',
    padding: '8px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #ebebeb',
    controlColor: '#000000',
    controlBorderRadius: '12px',
    controlPadding: '8px',
    controlHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
    controlActiveBackgroundColor: 'hsl(0, 0%, 0%, 8.6%)',
    controlSelectedBackgroundColor: '#007AFF',
    controlSelectedColor: '#ffffff',
    controlTextColor: '#333333',
  },

  tooltip: {
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '12px',
    borderRadius: '16px',
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.12)',
  },

  contextMenu: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.12)',
    border: '1px solid #ebebeb',
    padding: '4px',
    itemGap: '8px',
    itemPadding: '8px',
    itemBorderRadius: '12px',
    itemFontSize: '14px',
    itemColor: '#333333',
    itemHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
    itemActiveBackgroundColor: 'hsl(0, 0%, 0%, 8.6%)',
    itemDisabledColor: '#aaaaaa',
  },

  menu: {
    backgroundColor: '#ffffff',
    width: '200px',
    padding: '8px',
    borderRadius: '12px',
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #ebebeb',
    gap: '4px',
    itemPadding: '8px',
    itemHeight: '40px',
    itemMinHeight: '40px',
    itemFontSize: '14px',
    itemColor: '#333333',
    itemBorderRadius: '12px',
    itemHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
    itemSelectedBackgroundColor: '#007aff',
    itemSelectedColor: '#ffffff',
    itemInputSelectionColor: 'rgba(255, 255, 255, 0.16)',
  },

  slideToggle: {
    width: '40px',
    height: '22px',
    trackColor: '#ccc',
    trackColorChecked: '#007AFF',
    borderRadius: '11px',
    transitionDuration: '0.2s',
    thumbSize: '18px',
    thumbColor: '#fff',
  },

  splitButton: {
    padding: '4px 8px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #ebebeb',
    gap: '4px',
    hoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
    dividerWidth: '1px',
    fontSize: '14px',
  },

  dropdown: {
    color: '#333333',
    hoverBackgroundColor: '#f0f0f0',
    selectedBackgroundColor: '#007bff1a',
    accentColor: '#007bff',
  },

  opacitySlider: {
    filledColor: '#007AFF',
    emptyColor: '#e0e0e0',
    thumbColor: '#ffffff',
    thumbBorderColor: '#007AFF',
  },

  strokeSize: {
    hoverBackgroundColor: '#ebebeb',
    selectedBackgroundColor: '#ebebeb',
  },

  lineEndings: {
    labelColor: '#666666',
    optionBackgroundColor: '#ffffff',
    hoverBackgroundColor: '#ebebeb',
    selectedBackgroundColor: '#ebebeb',
  },

  utilityPanel: {
    buttonBorderRadius: '8px',
  },

  colorPalette: {
    hoverBackgroundColor: '#ebebeb',
    whiteCircleBorderColor: '#dddcdc',
  },

  submenu: {
    gap: '4px',
  },

  portal: {
    maxHeight: '300px',
  },
};
