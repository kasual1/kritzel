import { KritzelTheme } from '../interfaces/theme.interface';

/**
 * Dark theme preset
 */
export const darkTheme: KritzelTheme = {
  name: 'dark',

  global: {
    pointerCursor: 'pointer',
    focusRingColor: 'rgba(0, 122, 255, 0.4)',
    focusColor: '#4da3ff',
    iconColor: 'currentColor',
    dividerColor: '#3a3a3a',
    selectionBorderColor: '#4da3ff',
  },

  engine: {
    backgroundColor: '#1a1a1a',
  },

  controls: {
    gap: '8px',
    padding: '8px',
    backgroundColor: '#2a2a2a',
    borderRadius: '16px',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
    border: '1px solid #3a3a3a',
    controlColor: '#ffffff',
    controlBorderRadius: '12px',
    controlPadding: '8px',
    controlHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
    controlActiveBackgroundColor: 'hsl(0, 0%, 100%, 12%)',
    controlSelectedBackgroundColor: '#0A84FF',
    controlSelectedColor: '#ffffff',
    controlTextColor: '#e0e0e0',
  },

  tooltip: {
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
    padding: '12px',
    borderRadius: '16px',
    boxShadow: '0 1px 8px rgba(0, 0, 0, 0.4)',
  },

  contextMenu: {
    backgroundColor: '#2a2a2a',
    borderRadius: '12px',
    boxShadow: '0 1px 8px rgba(0, 0, 0, 0.4)',
    border: '1px solid #3a3a3a',
    padding: '4px',
    itemGap: '8px',
    itemPadding: '8px',
    itemBorderRadius: '12px',
    itemFontSize: '14px',
    itemColor: '#e0e0e0',
    itemHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
    itemActiveBackgroundColor: 'hsl(0, 0%, 100%, 12%)',
    itemDisabledColor: '#666666',
  },

  menu: {
    backgroundColor: '#2a2a2a',
    width: '200px',
    padding: '8px',
    borderRadius: '12px',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
    border: '1px solid #3a3a3a',
    gap: '4px',
    itemPadding: '8px',
    itemHeight: '40px',
    itemMinHeight: '40px',
    itemFontSize: '14px',
    itemColor: '#e0e0e0',
    itemBorderRadius: '12px',
    itemHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
    itemSelectedBackgroundColor: '#0A84FF',
    itemSelectedColor: '#ffffff',
    itemInputSelectionColor: 'rgba(255, 255, 255, 0.2)',
  },

  slideToggle: {
    width: '40px',
    height: '22px',
    trackColor: '#4a4a4a',
    trackColorChecked: '#0A84FF',
    borderRadius: '11px',
    transitionDuration: '0.2s',
    thumbSize: '18px',
    thumbColor: '#ffffff',
  },

  splitButton: {
    padding: '4px 8px',
    backgroundColor: '#2a2a2a',
    borderRadius: '12px',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
    border: '1px solid #3a3a3a',
    gap: '4px',
    hoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
    dividerWidth: '1px',
    fontSize: '14px',
  },

  dropdown: {
    color: '#e0e0e0',
    hoverBackgroundColor: '#3a3a3a',
    selectedBackgroundColor: 'rgba(10, 132, 255, 0.2)',
    accentColor: '#0A84FF',
  },

  opacitySlider: {
    filledColor: '#0A84FF',
    emptyColor: '#4a4a4a',
    thumbColor: '#ffffff',
    thumbBorderColor: '#0A84FF',
  },

  strokeSize: {
    hoverBackgroundColor: '#3a3a3a',
    selectedBackgroundColor: '#3a3a3a',
  },

  lineEndings: {
    labelColor: '#999999',
    optionBackgroundColor: '#2a2a2a',
    hoverBackgroundColor: '#3a3a3a',
    selectedBackgroundColor: '#3a3a3a',
  },

  utilityPanel: {
    buttonBorderRadius: '8px',
  },

  colorPalette: {
    hoverBackgroundColor: '#3a3a3a',
    whiteCircleBorderColor: '#4a4a4a',
  },

  submenu: {
    gap: '4px',
  },

  portal: {
    maxHeight: '300px',
  },
};
