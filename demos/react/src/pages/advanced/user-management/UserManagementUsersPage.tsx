import { useMemo } from "react";
import { KritzelEditor } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { collaborators, createUserManagementWorkspaces, currentUser } from "./user-management-shared";

export function UserManagementUsersPage() {
  const workspaces = useMemo(() => createUserManagementWorkspaces(), []);

  return (
    <KritzelEditor
      editorId="user-management-users"
      user={currentUser}
      activeUsers={collaborators}
      workspaces={workspaces}
      theme="light"
      themes={[reactThemeLight, reactThemeDark]}
      isPanningEnabled={false}
      isZoomingEnabled={false}
      isMoreMenuVisible={false}
      isWorkspaceManagerVisible={false}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}