import { useMemo } from "react";
import { UpdrawEditor } from "@updraw/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { collaborators, createUserManagementWorkspaces, currentUser } from "./user-management-shared";

export function UserManagementUsersPage() {
  const workspaces = useMemo(() => createUserManagementWorkspaces(), []);

  return (
    <UpdrawEditor
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