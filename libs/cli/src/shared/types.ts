export type Framework = 'angular' | 'react' | 'vue';
export type ComponentKind = 'editor' | 'engine';
export type PackageManager = 'npm' | 'pnpm' | 'yarn';
export interface Manifest {
  name?: string;
  version?: string;
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
}
export interface ProjectContext {
  appDir: string;
  workspaceDir: string;
  manifest: Manifest;
  framework: Framework;
  manager: PackageManager;
  managerVersion: string;
}
export interface InitOptions {
  cwd: string;
  framework?: Framework;
  component?: ComponentKind;
  packageManager?: PackageManager;
  generateComponent?: boolean;
  output?: string;
  kritzelVersion?: string;
  yes?: boolean;
}
export interface PackageMetadata {
  name: string;
  version: string;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
}
export const dependencies = (manifest: Manifest): Record<string, string> =>
  ({ ...manifest.devDependencies, ...manifest.dependencies });
