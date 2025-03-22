import { RpcServer, createServiceDecorator } from '@gepick/core/common';

export const IPluginClient = Symbol('PluginClient');
export interface IPluginClient {
  postMessage: (message: string) => Promise<void>
}

/**
 * Plugin engine (API) type, i.e. 'theiaPlugin', 'vscode', etc.
 */
export type PluginEngine = string;

/**
 * This interface describes a plugin model object, which is populated from package.json.
 */
export interface IPluginModel {
  name: string
  publisher: string
  version: string
  displayName: string
  description: string
  engine: {
    type: PluginEngine
    version: string
  }
  entryPoint: {
    frontend?: string
    backend?: string
  }
}

/**
 * This interface describes a plugin lifecycle object.
 */
export interface IPluginLifecycle {
  startMethod: string
  stopMethod: string
  /**
   * Frontend module name, frontend plugin should expose this name.
   */
  frontendModuleName?: string
  /**
   * Path to the script which should do some initialization before frontend plugin is loaded.
   */
  frontendInitPath?: string
  /**
   * Path to the script which should do some initialization before backend plugin is loaded.
   */
  backendInitPath?: string
}

/**
 * This interface describes a package.json object.
 */
export interface IPluginPackage {
  name: string
  publisher: string
  version: string
  engines: {
    [type in PluginEngine]: string;
  }
  theiaPlugin?: {
    frontend?: string
    backend?: string
  }
  main?: string
  displayName: string
  description: string
  contributes: object
}

export interface IPluginMetadata {
  source: IPluginPackage
  model: IPluginModel
  lifecycle: IPluginLifecycle
}

export interface IPluginDeployerEntry {

  /**
   * ID (before any resolution)
   */
  id: () => string

  /**
   * Original resolved path
   */
  originalPath: () => string

  /**
   * Local path on the filesystem
   */
  path: () => string

  /**
   * Get a specific entry
   */
  getValue: <T>(key: string) => T

  /**
   * Store a value
   */
  storeValue: <T>(key: string, value: T) => void

  /**
   * Update path
   */
  updatePath: (newPath: string) => void

  getChanges: () => string[]

  isFile: () => boolean

  isDirectory: () => boolean

  /**
   * Resolved if a resolver has handle this plugin
   */
  isResolved: () => boolean

  resolvedBy: () => string

  /**
   * Accepted when a handler is telling this location can go live
   */
  isAccepted: (...types: any[]) => boolean

  accept: (...types: any[]) => void

  hasError: () => boolean

  type: number
  /**
   * A fs path to a directory where a plugin is located.
   * Depending on a plugin format it can be different from `path`.
   * Use `path` if you want to resolve something within a plugin, like `README.md` file.
   * Use `rootPath` if you want to manipulate the entire plugin location, like delete or move it.
   */
  rootPath: string
}

export const IPluginServer = createServiceDecorator("PluginServer")
export interface IPluginServer extends RpcServer<IPluginClient> {
  getHostedPlugin: () => Promise<IPluginMetadata | undefined>

  getDeployedMetadata: () => Promise<IPluginMetadata[]>
  getDeployedFrontendMetadata: () => Promise<IPluginMetadata[]>
  deployFrontendPlugins: (frontendPlugins: IPluginDeployerEntry[]) => Promise<void>
  getDeployedBackendMetadata: () => Promise<IPluginMetadata[]>
  deployBackendPlugins: (backendPlugins: IPluginDeployerEntry[]) => Promise<void>

  onMessage: (message: string) => Promise<void>

  isPluginValid: (uri: string) => Promise<boolean>
  runHostedPluginInstance: (uri: string) => Promise<string>
  terminateHostedPluginInstance: () => Promise<void>
  isHostedTheiaRunning: () => Promise<boolean>
  getHostedPluginInstanceURI: () => Promise<string>

  deployPlugins: (entries: string[]) => void
}

export function getPluginId(plugin: IPluginPackage | IPluginModel): string {
  return `${plugin.publisher}_${plugin.name}`.replace(/\W/g, '_');
}

export interface IPluginScannerContext {

  addPlugin: (pluginId: string, path: string) => void

  getPlugins: () => any[]

  getOriginId: () => string

}

/**
 * A plugin resolver is handling how to resolve a plugin link into a local resource.
 */
export const IPluginResolver = Symbol('PluginResolver');
/**
 * A resolver handle a set of resource
 */
export interface IPluginResolver {

  accept: (pluginSourceId: string) => boolean

  resolve: (pluginResolverContext: IPluginScannerContext) => Promise<void>

}

/**
 * Whether a plugin installed by a user or system.
 */
export enum PluginType {
  System,
  User,
};

export interface IDeployedPlugin {
  /**
   * defaults to system
   */
  type?: PluginType
  metadata: any
  contributes?: any
}
