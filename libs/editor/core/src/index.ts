/**
 * Entry point for the Kritzel editor component package.
 *
 * Components are consumed through the generated custom elements or framework
 * wrappers. Asset providers are also available here from @kritzel/engine.
 */

export type * from './components';

export type HTMLKritzelEditorElement = HTMLElementTagNameMap['kritzel-editor'];

export {
	HttpAssetProvider,
	IndexedDBAssetProvider,
	PresignedAssetProvider,
} from '@kritzel/engine';

export type {
	KritzelAssetStorageConfig,
	AssetProviderConfig,
	AssetProviderFactory,
	IAssetStorageProvider,
	HttpAssetProviderOptions,
	IndexedDBAssetProviderOptions,
	PresignedAssetProviderOptions,
} from '@kritzel/engine';
