import { useMemo, useRef, useState } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement, type IKritzelUser } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createAuthenticatedUser, createUserManagementWorkspaces, loginConfig } from "./user-management-shared";

export function UserManagementLoginPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [user, setUser] = useState<IKritzelUser>();
  const workspaces = useMemo(() => createUserManagementWorkspaces(), []);

  return (
    <KritzelEditor
      ref={editorRef}
      editorId="user-management-login"
      loginConfig={loginConfig}
      user={user}
      workspaces={workspaces}
      theme="light"
      themes={[reactThemeLight, reactThemeDark]}
      isPanningEnabled={false}
      isZoomingEnabled={false}
      isMoreMenuVisible={false}
      isWorkspaceManagerVisible={false}
      onIsReady={() => void editorRef.current?.openLoginDialog()}
      onLogin={(event) => {
        setUser(createAuthenticatedUser(event.detail.provider));
        void editorRef.current?.closeLoginDialog();
      }}
      onLogout={() => setUser(undefined)}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}