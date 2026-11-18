import { useState } from "react";
import {
  UpmadeEditor,
  UpmadeShape,
  UpmadeWorkspace,
  ShapeType,
  type UpmadeObjectConfig,
  type UpmadeObjectTitlebarConfig,
  type UpmadeTheme,
} from "@upmade/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle } from "../../shared/demo-shared";

// `themes` replaces the registry, so each variant spreads the app theme's titlebar tokens and overrides a few.
const transparentTitlebar = {
  backgroundColor: "transparent",
  hoverBackgroundColor: "transparent",
  activeBackgroundColor: "transparent",
  offset: "2px",
  paddingX: "0",
};

const transparentTitlebarLightTheme: UpmadeTheme = {
  ...reactThemeLight,
  titlebar: { ...reactThemeLight.titlebar, ...transparentTitlebar },
};

const transparentTitlebarDarkTheme: UpmadeTheme = {
  ...reactThemeDark,
  titlebar: { ...reactThemeDark.titlebar, ...transparentTitlebar },
};

const themes = [transparentTitlebarLightTheme, transparentTitlebarDarkTheme];

const objectConfig: UpmadeObjectConfig = {
  hasTitlebar: (object) => object.__class__ === "UpmadeShape",
  isRotatable: false,
  isResizable: false,
};

const objectTitlebar: UpmadeObjectTitlebarConfig = {
  left: [{ id: "title", type: "title" }],
  right: [
    { id: "settings", type: "button", icon: "settings", tooltip: "Settings" },
    { id: "download", type: "button", icon: "download", tooltip: "Download" },
    { id: "play", type: "button", icon: "play", label: "PLAY", variant: "outlined" },
  ],
};

const frameConfig = {
  shapeType: ShapeType.Rectangle,
  fillColor: { light: "#f5f6f7", dark: "#2b2c2f" },
  strokeColor: { light: "#f5f6f7", dark: "#2b2c2f" },
  strokeWidth: 2,
};

function createFrames() {
  return [
    new UpmadeShape({ ...frameConfig, name: "Landing page", translateX: -270, translateY: -110, width: 300, height: 200 }),
    new UpmadeShape({ ...frameConfig, name: "Pricing", translateX: 70, translateY: -110, width: 200, height: 200 }),
  ];
}

export function TitlebarStylingPage() {
  const [workspaces] = useState(() => [
    new UpmadeWorkspace({ objects: createFrames() }),
  ]);

  return (
    <div style={hostStyle}>
      <UpmadeEditor
        editorId="titlebar-styling"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        objectConfig={objectConfig}
        objectTitlebar={objectTitlebar}
        syncConfig={undefined}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={true}
        isWorkspaceManagerVisible={false}
        style={editorStyle}
      />
    </div>
  );
}
