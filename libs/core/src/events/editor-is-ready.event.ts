import { UpmadeAssetStorageConfig } from '../interfaces/asset-storage-config.interface';
import { UpmadeLoginConfig } from '../interfaces/login-config.interface';
import { UpmadeSyncConfig } from '../interfaces/sync-config.interface';
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
    syncConfig: UpmadeSyncConfig;
    assetStorageConfig?: UpmadeAssetStorageConfig;
    loginConfig: UpmadeLoginConfig;
    theme: ThemeName;
}