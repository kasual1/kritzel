import { useState } from "react";
import {
  KritzelEditor,
  KritzelShape,
  KritzelWorkspace,
  ShapeType,
  darkTheme,
  lightTheme,
  type KritzelObjectConfig,
  type KritzelObjectTitlebarConfig,
  type KritzelTheme,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle } from "../../shared/demo-shared";

// `themes` replaces the registry, so each variant spreads the default titlebar tokens and overrides a few.
const transparentTitlebar = {
  backgroundColor: "transparent",
  hoverBackgroundColor: "transparent",
  activeBackgroundColor: "transparent",
  offset: "2px",
  paddingX: "0",
};

const transparentTitlebarLightTheme: KritzelTheme = {
  ...reactThemeLight,
  titlebar: { ...lightTheme.titlebar, ...transparentTitlebar },
};

const transparentTitlebarDarkTheme: KritzelTheme = {
  ...reactThemeDark,
  titlebar: { ...darkTheme.titlebar, ...transparentTitlebar },
};

const themes = [transparentTitlebarLightTheme, transparentTitlebarDarkTheme];

const objectConfig: KritzelObjectConfig = {
  hasTitlebar: (object) => object.__class__ === "KritzelShape",
};

const objectTitlebar: KritzelObjectTitlebarConfig = {
  left: [{ id: "title", type: "title" }],
  right: [
    { id: "settings", type: "button", icon: "settings", tooltip: "Settings" },
    { id: "download", type: "button", icon: "download", tooltip: "Download" },
    { id: "play", type: "button", icon: "play", label: "PLAY", variant: "outlined" },
  ],
};

const frameConfig = {
  shapeType: ShapeType.Rectangle,
  fillColor: { light: "#faf9f5", dark: "#30302e" },
  strokeColor: { light: "#e8e6dc", dark: "#3e3e38" },
  strokeWidth: 2,
};

function createFrames() {
  return [
    new KritzelShape({ ...frameConfig, name: "Landing page", translateX: -270, translateY: -110, width: 300, height: 200 }),
    new KritzelShape({ ...frameConfig, name: "Pricing", translateX: 70, translateY: -110, width: 200, height: 200 }),
  ];
}

export function TitlebarStylingPage() {
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ objects: createFrames() }),
  ]);

  return (
    <div style={hostStyle}>
      <KritzelEditor
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
