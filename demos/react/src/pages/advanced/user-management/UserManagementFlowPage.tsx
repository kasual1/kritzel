import { useRef, useState } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement, type IKritzelUser } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";

const demoAccounts: Record<string, IKritzelUser> = {
  google: { id: "user-google-1", displayName: "Ada Lovelace", email: "ada@example.com", oauthProvider: "google", color: "#61dafb", isGuest: false },
  github: { id: "user-github-1", displayName: "Alan Turing", email: "alan@example.com", oauthProvider: "github", color: "#1f2937", isGuest: false },
};

const loginConfig = {
  title: "Sign in",
  subtitle: "Authentication is handled by your application.",
  providers: [
    { name: "google", label: "Continue with Google" },
    { name: "github", label: "Continue with GitHub" },
  ],
};

export function UserManagementFlowPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [user, setUser] = useState<IKritzelUser | undefined>(undefined);
  const [status, setStatus] = useState("Signed out");

  const authenticate = (provider: string) =>
    new Promise<IKritzelUser>((resolve) => setTimeout(() => resolve(demoAccounts[provider] ?? demoAccounts.google), 800));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
        <strong>Login Flow:</strong>
        <span>Status: {status}</span>
        <button style={{ marginLeft: "auto" }} onClick={() => void editorRef.current?.openLoginDialog()}>
          Open login dialog
        </button>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="user-management-flow"
        loginConfig={loginConfig}
        user={user}
        theme="light"
        themes={[reactThemeLight]}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onLogin={async (event) => {
          const provider = event.detail.provider;
          setStatus(`Authenticating with ${provider}...`);
          // The dialog stays in its loading state until the app resolves authentication.
          await editorRef.current?.setLoginLoading(provider);
          const account = await authenticate(provider);
          await editorRef.current?.setLoginLoading(null);
          setUser(account);
          setStatus(`Signed in as ${account.displayName}`);
        }}
        onLogout={() => {
          setUser(undefined);
          setStatus("Signed out");
        }}
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
}
