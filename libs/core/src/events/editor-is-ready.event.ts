import { UpdrawAssetStorageConfig } from '../interfaces/asset-storage-config.interface';
import { UpdrawLoginConfig } from '../interfaces/login-config.interface';
import { UpdrawSyncConfig } from '../interfaces/sync-config.interface';
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
    syncConfig: UpdrawSyncConfig;
    assetStorageConfig?: UpdrawAssetStorageConfig;
    loginConfig: UpdrawLoginConfig;
    theme: ThemeName;
}