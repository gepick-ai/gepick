import gepick from "@gepick/plugin-api";
import { Disposable, EXT } from '@gepick/plugin-system/common';
import { CommandRegistryExt } from './command-registry-ext';

export function createPluginAPI(rpc: any): typeof gepick {
  const commandRegistryExt = new CommandRegistryExt(rpc)
  rpc.set(EXT.COMMAND_REGISTRY, commandRegistryExt)

  const commands: typeof gepick.commands = {
    registerCommand(command: gepick.Command, handler?: <T>(...args: any[]) => T | PromiseLike<T>): Disposable {
      return commandRegistryExt.registerCommand(command, handler)
    },
    executeCommand<T>(commandId: string, ...args: any[]): PromiseLike<T | undefined> {
      return commandRegistryExt.executeCommand(commandId, args)
    },
    registerHandler(commandId: string, handler: (...args: any[]) => any): Disposable {
      return commandRegistryExt.registerHandler(commandId, handler)
    },
  }

  return <typeof gepick>{
    commands,
  }
}
