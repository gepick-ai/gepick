import { IRPCProtocol, createProxyIdentifier } from '../rpc-protocol';
import { ICommandRegistryExt, ICommandRegistryMain } from './command-registry';
import { IPluginManagerExt } from './plugin-manager';

export const MainContext = {
  CommandRegistry: createProxyIdentifier<ICommandRegistryMain>("CommandRegistryMain"),
}

export const PluginHostContext = {
  PluginManager: createProxyIdentifier<IPluginManagerExt>("PluginManagerExt"),
  CommandRegistry: createProxyIdentifier<ICommandRegistryExt>("CommandRegistryExt"),
}

export interface IMainContext extends IRPCProtocol {}
export interface IPluginHostContext extends IRPCProtocol {}
