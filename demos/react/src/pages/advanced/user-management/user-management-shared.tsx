import {
  KritzelWorkspace,
  type IKritzelUser,
  type KritzelLoginConfig,
} from "@kritzel/react-editor";
import { createSeedObjects } from "../../getting-started/seed-objects";

export const loginConfig: KritzelLoginConfig = {
  title: "Sign in",
  providers: [
    { name: "google", icon: "google", label: "Continue with Google" },
    { name: "facebook", icon: "facebook", label: "Continue with Facebook" },
    { name: "github", icon: "github", label: "Continue with GitHub" },
  ],
};

export const currentUser: IKritzelUser = {
  id: "user-current-1",
  displayName: "Ada Lovelace",
  email: "ada@example.com",
  oauthProvider: "demo",
  color: "#087ea4",
  isGuest: false,
};

export const collaborators: IKritzelUser[] = [
  { id: "user-collaborator-1", displayName: "Grace Hopper", email: "grace@example.com", oauthProvider: "demo", color: "#0f766e", isGuest: false },
  { id: "user-collaborator-2", displayName: "Katherine Johnson", email: "katherine@example.com", oauthProvider: "demo", color: "#7c3aed", isGuest: false },
  { id: "user-collaborator-3", displayName: "Margaret Hamilton", email: "margaret@example.com", oauthProvider: "demo", color: "#ea580c", isGuest: false },
];

export function createUserManagementWorkspaces(): KritzelWorkspace[] {
  return [new KritzelWorkspace({ objects: createSeedObjects() })];
}

export function createAuthenticatedUser(provider: string): IKritzelUser {
  return {
    id: `user-${provider}-1`,
    displayName: "Ada Lovelace",
    color: "#087ea4",
    isGuest: false,
  };
}