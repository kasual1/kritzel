<script setup lang="ts">

import {
  getEditorRef,
  KritzelEditor,
  lightTheme,
  type KritzelTheme,
} from 'kritzel-vue'
import { seedEditor } from '../shared/concept-shared'

const brandPurple = '#7c3aed'
const brandPurpleHover = '#6d28d9'
const brandPurpleActive = '#5b21b6'
const brandPurpleLight = 'rgba(124, 58, 237, 0.1)'
const brandPurpleMedium = 'rgba(124, 58, 237, 0.2)'

const brandedPurpleFlatTheme: KritzelTheme = {
  ...lightTheme,
  name: 'branded-purple-flat',
  global: {
    ...lightTheme.global,
    primaryColor: brandPurple,
    primaryHoverColor: brandPurpleHover,
    focusColor: brandPurple,
    focusRingColor: brandPurple,
    borderColor: '#d7c5fb',
    textPrimary: '#3b2a66',
    textSecondary: '#5f4f8d',
  },
  engine: {
    ...lightTheme.engine,
    backgroundColor: 'transparent',
  },
  checkerboard: {
    ...lightTheme.checkerboard,
    colorLight: '#f9f5ff',
    colorDark: '#f0e6ff',
  },
  colorPalette: {
    ...lightTheme.colorPalette,
    hoverBackgroundColor: '#eadfff',
    selectedBackgroundColor: '#f2e9ff',
    circleBorderColor: '#e1d2ff',
  },
  controls: {
    ...lightTheme.controls,
    backgroundColor: '#f8f2ff',
    border: '1px solid #e1d2ff',
    borderRadius: '0px',
    controlBorderRadius: '0px',
    controlColor: brandPurple,
    controlHoverBackgroundColor: brandPurpleLight,
    controlActiveBackgroundColor: brandPurpleMedium,
    controlSelectedBackgroundColor: brandPurple,
    controlSelectedColor: '#ffffff',
  },
  selection: {
    ...lightTheme.selection,
    borderColor: brandPurple,
    boxBackgroundColor: brandPurpleMedium,
    boxBorderColor: 'rgba(124, 58, 237, 0.45)',
    handleColor: '#ffffff',
    handleStrokeColor: brandPurple,
  },
  button: {
    ...lightTheme.button,
    borderRadius: '0px',
    primaryBackgroundColor: brandPurple,
    primaryColor: '#ffffff',
    primaryHoverBackgroundColor: brandPurpleHover,
    primaryActiveBackgroundColor: brandPurpleActive,
    textColor: brandPurple,
    textHoverBackgroundColor: brandPurpleLight,
    textActiveBackgroundColor: brandPurpleMedium,
  },
  backToContent: {
    ...lightTheme.backToContent,
    borderRadius: '0px',
  },
  contextMenu: {
    ...lightTheme.contextMenu,
    backgroundColor: '#f8f2ff',
    border: '1px solid #e1d2ff',
    borderRadius: '0px',
    itemBorderRadius: '0px',
    itemHoverBackgroundColor: brandPurpleLight,
    itemActiveBackgroundColor: brandPurpleMedium,
  },
  dialog: {
    ...lightTheme.dialog,
    backdropColor: 'rgba(62, 34, 120, 0.28)',
    backgroundColor: '#faf6ff',
    border: '1px solid #e1d2ff',
    borderRadius: '0px',
    headerBorder: '1px solid #e1d2ff',
    footerBorder: '1px solid #e1d2ff',
    titleColor: '#3b2a66',
    closeButtonBackground: '#f2e9ff',
    closeButtonHoverBackground: brandPurpleLight,
    closeButtonActiveBackground: brandPurpleMedium,
    closeButtonColor: brandPurple,
    closeButtonBorderRadius: '0px',
  },
  masterDetail: {
    ...lightTheme.masterDetail,
    backgroundColor: '#f6eeff',
    detailBackgroundColor: '#fbf8ff',
    menuBackgroundColor: '#f3e9ff',
    menuBorderRight: '1px solid #e1d2ff',
    menuItemBackgroundColor: '#efe3ff',
    menuItemBorderRadius: '0px',
    menuItemColor: '#4f3f78',
    menuItemChevronColor: '#6d28d9',
    menuItemFontWeight: '500',
    menuItemHoverBackgroundColor: '#e7d8ff',
    menuItemActiveBackgroundColor: '#dcc4ff',
    menuItemSelectedBackgroundColor: '#6d28d9',
    menuItemSelectedHoverBackgroundColor: brandPurpleHover,
    menuItemSelectedColor: '#ffffff',
    menuItemSelectedFontWeight: '600',
  },
  menu: {
    ...lightTheme.menu,
    backgroundColor: '#f8f2ff',
    border: '1px solid #e1d2ff',
    borderRadius: '0px',
    itemBorderRadius: '0px',
    itemOverlayBackgroundColor: brandPurpleLight,
    itemButtonHoverBackgroundColor: brandPurpleLight,
    itemEditingBackgroundColor: brandPurpleLight,
    itemChildOpenBackgroundColor: brandPurpleMedium,
    itemSelectedBackgroundColor: brandPurple,
    itemSelectedColor: '#ffffff',
  },
  moreMenu: {
    ...lightTheme.moreMenu,
    backgroundColor: '#f8f2ff',
    border: '1px solid #e1d2ff',
    borderRadius: '0px',
    buttonColor: brandPurple,
    buttonHoverBackgroundColor: brandPurpleLight,
    buttonActiveBackgroundColor: brandPurpleMedium,
    innerBorderRadius: '0px',
  },
  dropdown: {
    ...(lightTheme.dropdown ?? {}),
    background: '#faf6ff',
    borderColor: '#e1d2ff',
    borderRadius: '0px',
    textColor: '#3b2a66',
    accentColor: brandPurple,
    hoverBackgroundColor: brandPurpleLight,
    hoverBorderColor: brandPurple,
    menuBorderRadius: '0px',
    selectedBackgroundColor: brandPurpleMedium,
  },
  numericInput: {
    ...(lightTheme.numericInput ?? {}),
    inputBackground: '#faf6ff',
    borderColor: '#e1d2ff',
    borderRadius: '0px',
    hoverBorderColor: brandPurple,
    focusBorderColor: brandPurple,
    textColor: '#3b2a66',
    labelColor: '#4a3a75',
    selectionBackground: brandPurple,
    selectionColor: '#ffffff',
    spinnerBackground: '#f2e9ff',
    spinnerHoverBackground: brandPurpleLight,
    spinnerActiveBackground: brandPurpleMedium,
    spinnerBorderRadius: '0px',
    spinnerColor: brandPurple,
  },
  opacitySlider: {
    ...lightTheme.opacitySlider,
    trackColor: '#e1d2ff',
    activeColor: brandPurple,
    thumbColor: '#f8f2ff',
    thumbBorderColor: '#c4a8f7',
  },
  settings: {
    ...lightTheme.settings,
    contentHeadingColor: '#3b2a66',
    contentTextColor: '#584885',
    labelColor: '#3b2a66',
    descriptionColor: '#665791',
    shortcutItemBg: '#f2e9ff',
    shortcutKeyBg: '#eadfff',
    shortcutKeyColor: '#3b2a66',
    shortcutKeyBorder: '#e1d2ff',
  },
  pillTabs: {
    ...lightTheme.pillTabs,
    background: '#efe3ff',
    tabBackground: 'transparent',
    tabBackgroundHover: '#e7d8ff',
    tabBackgroundSelected: '#6d28d9',
    tabTextColor: '#4f3f78',
    tabTextColorSelected: '#ffffff',
    tabShadowSelected: 'none',
    borderRadius: '0px',
    tabBorderRadius: '0px',
  },
  slideToggle: {
    ...lightTheme.slideToggle,
    trackColor: '#e6d8ff',
    trackCheckedColor: brandPurple,
    thumbColor: '#ffffff',
  },
  splitButton: {
    ...lightTheme.splitButton,
    backgroundColor: '#f8f2ff',
    border: '1px solid #e1d2ff',
    borderRadius: '0px',
    color: brandPurple,
    hoverBackgroundColor: brandPurpleLight,
    dividerBackgroundColor: '#e1d2ff',
  },
  textInput: {
    ...(lightTheme.textInput ?? {}),
    background: '#faf6ff',
    borderColor: '#e1d2ff',
    borderRadius: '0px',
    hoverBorderColor: '#c4a8f7',
    focusBorderColor: brandPurple,
    textColor: '#3b2a66',
    placeholderColor: '#8f7dbf',
    labelColor: '#4a3a75',
    selectionBackground: brandPurple,
    selectionColor: '#ffffff',
    suffixBackground: '#f2e9ff',
    suffixColor: '#5f4f8d',
  },
  tooltip: {
    ...lightTheme.tooltip,
    backgroundColor: '#f8f2ff',
    borderRadius: '0px',
  },
  utilityPanel: {
    ...lightTheme.utilityPanel,
    backgroundColor: '#f2e9ff',
    buttonBorderRadius: '0px',
    buttonColor: brandPurpleActive,
    buttonHoverBackgroundColor: brandPurpleMedium,
    separatorColor: '#e1d2ff',
  },
}

const editor = getEditorRef('editor');

async function onReady() {
  if (editor.value) {
    await seedEditor(editor.value)
  }
}
</script>

<template>
  <div
    :style="{
      display: 'block',
      height: '100%',
      background: 'linear-gradient(180deg, #fbf8ff 0%, #f3ebff 100%)',
    }"
  >
    <KritzelEditor
      ref="editor"
      editorId="theming-custom"
      theme="branded-purple-flat"
      :themes="[brandedPurpleFlatTheme]"
      :wheelEnabled="false"
      :isMoreMenuVisible="true"
      :isWorkspaceManagerVisible="true"
      :style="{
        display: 'block',
        height: '100%',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8f2ff 100%)',
        border: '1px solid #e1d2ff',
        borderRadius: 0,
        boxSizing: 'border-box',
      }"
      @isReady="onReady"
    />
  </div>
</template>
