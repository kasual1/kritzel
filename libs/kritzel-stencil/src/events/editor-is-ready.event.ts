import { KritzelAssetStorageConfig } from '../interfaces/asset-storage-config.interface';
import { KritzelLoginConfig } from '../interfaces/login-config.interface';
import { KritzelSyncConfig } from '../interfaces/sync-config.interface';
import { ThemeName } from '../interfaces/theme.interface';

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
    assetStorageConfig?: KritzelAssetStorageConfig;
    loginConfig: KritzelLoginConfig;
    theme: ThemeName;
}