import { useRef } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";

const providerIcons = {
  "auth-google":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 12h5a5 5 0 1 1-1.6-3.6"/></svg>',
  "auth-github":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18-6-6 6-6"/><path d="m15 6 6 6-6 6"/></svg>',
  "auth-microsoft":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>',
  "auth-email":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
};

const loginConfig = {
  title: "Sign in to Kritzel",
  subtitle: "Choose a provider to continue to your workspace.",
  providers: [
    { name: "google", label: "Continue with Google", icon: "auth-google" },
    { name: "github", label: "Continue with GitHub", icon: "auth-github" },
    { name: "microsoft", label: "Continue with Microsoft", icon: "auth-microsoft" },
    { name: "email", label: "Continue with Email", icon: "auth-email" },
  ],
};

export function UserManagementProvidersPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ padding: 8, background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
        <strong>Login Providers:</strong> each entry in loginConfig.providers becomes a button in the dialog.
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="user-management-providers"
        loginConfig={loginConfig}
        customSvgIcons={providerIcons}
        theme="light"
        themes={[reactThemeLight]}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          void editorRef.current?.openLoginDialog();
        }}
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
}
