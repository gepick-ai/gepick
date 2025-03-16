import gepick from "@gepick/plugin-api";
import { IDisposable, ServiceContainer } from "@gepick/core/common";
import { PluginHostContext } from "../../common/plugin-api/api-context";
import { ICommandRegistryExt } from "../../common/plugin-api/command-registry";
import { CommandRegistryExt } from './plugin-api/command-registry-ext';
import { IPluginHostRpcService, PluginHostRpcService } from "./plugin-host-rpc";

export function setupPluginApi(serviceContainer: ServiceContainer) {
  const pluginHostRpcService = serviceContainer.get<IPluginHostRpcService>(IPluginHostRpcService)
  const commandRegistryExt = serviceContainer.get<CommandRegistryExt>(ICommandRegistryExt)

  pluginHostRpcService.set(PluginHostContext.CommandRegistry, commandRegistryExt)

  const commands: typeof gepick.commands = {
    registerCommand(command: gepick.Command, handler?: <T>(...args: any[]) => T | PromiseLike<T>): IDisposable {
      return commandRegistryExt.registerCommand(command, handler)
    },
    executeCommand<T>(commandId: string, ...args: any[]): PromiseLike<T | undefined> {
      return commandRegistryExt.executeCommand(commandId, args)
    },
    registerHandler(commandId: string, handler: (...args: any[]) => any): IDisposable {
      return commandRegistryExt.registerHandler(commandId, handler)
    },
  }

  return <typeof gepick>{
    commands,
  }
}
