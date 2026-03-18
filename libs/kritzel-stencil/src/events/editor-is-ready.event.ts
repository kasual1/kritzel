import { KritzelLoginConfig, KritzelSyncConfig } from "..";

export interface EditorIsReadyEvent {
    host: HTMLElement;
    activeWorkspace: {
        id: string;
        name: string;
        isPublic: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    syncConfig: KritzelSyncConfig;
    loginConfig: KritzelLoginConfig;
}