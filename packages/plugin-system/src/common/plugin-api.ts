import gepick from "@gepick/plugin-api"
import { IPluginLifecycle, IPluginModel, createProxyIdentifier } from '@gepick/plugin-system/common';

export const IPluginManagerExt = "PluginManagerExt"
export interface IPluginManagerExt {
  $initialize: (contextPath: string, pluginMetadata: any) => void
  $loadPlugin: (contextPath: string, plugin: any) => void
  $stopPlugin: (contextPath: string) => PromiseLike<void>
}

// Command Main端
export const ICommandRegistryMain = "CommandRegistryMain"
export interface ICommandRegistryMain {
  $registerCommand: (command: gepick.Command) => void
  $unregisterCommand: (id: string) => void
  $executeCommand: <T>(id: string, args: any[]) => PromiseLike<T | undefined>
  $getCommands: () => PromiseLike<string[]>
}

// Command Ext端
export const ICommandRegistryExt = "CommandRegistryExt"
export interface ICommandRegistryExt {
  $executeCommand: <T>(id: string, ...ars: any[]) => PromiseLike<T>
}

export const MAIN = {
  COMMAND_REGISTRY: createProxyIdentifier<ICommandRegistryMain>(ICommandRegistryMain),
}

export const EXT = {
  PLUGIN_MANAGER: createProxyIdentifier<IPluginManagerExt>(IPluginManagerExt),
  COMMAND_REGISTRY: createProxyIdentifier<ICommandRegistryExt>(ICommandRegistryExt),
}

export interface IPlugin {
  pluginPath: string
  model: IPluginModel
  lifecycle: IPluginLifecycle
}
