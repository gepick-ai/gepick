import gepick from "@gepick/plugin-api";
import { Contribution, IDisposable, InjectableService, toDisposable } from "@gepick/core/common";
import { Handler, ICommandRegistryExt, ICommandRegistryMain } from "../../../common/plugin-api/command-registry";
import { MainContext, PluginHostContext } from "../../../common/plugin-api/api-context";
import { IPluginHostRpcService } from "../plugin-host-rpc-service";
import { ILocalService } from "../../../common/rpc-protocol";

@Contribution(ILocalService)
export class CommandRegistryExt extends InjectableService implements ICommandRegistryExt, ILocalService {
  #commandRegistryMain: ICommandRegistryMain
  private commands = new Map<string, Handler>();

  onRpcServiceInit(pluginHostRpcService: IPluginHostRpcService) {
    pluginHostRpcService.setLocalService(PluginHostContext.CommandRegistry, this)
    this.#commandRegistryMain = pluginHostRpcService.getRemoteServiceProxy(MainContext.CommandRegistry);
  }

  $executeCommand<T>(id: string, ...args: any[]): PromiseLike<T> {
    if (this.commands.has(id)) {
      return this.executeLocalCommand(id, ...args);
    }
    else {
      return Promise.reject(new Error(`Command: ${id} does not exist.`));
    }
  }

  registerCommand(command: gepick.Command, handler?: Handler): IDisposable {
    if (this.commands.has(command.id)) {
      throw new Error(`Command ${command.id} already exist`);
    }

    if (handler) {
      this.commands.set(command.id, handler);
    }
    this.#commandRegistryMain.$registerCommand(command);

    return toDisposable(() => {
      this.#commandRegistryMain.$unregisterCommand(command.id);
    });
  }

  registerHandler(commandId: string, handler: Handler): IDisposable {
    if (this.commands.has(commandId)) {
      throw new Error(`Command ${commandId} already has handler`);
    }

    this.commands.set(commandId, handler);

    return toDisposable(() => {
      this.#commandRegistryMain.$unregisterCommand(commandId);
    });
  }

  executeCommand<T>(id: string, ...args: any[]): PromiseLike<T | undefined> {
    if (this.commands.has(id)) {
      return this.executeLocalCommand(id, args);
    }

    return Promise.resolve(void 0)
  }

  private executeLocalCommand<T>(id: string, ...args: any[]): PromiseLike<T> {
    const handler = this.commands.get(id);
    if (handler) {
      return Promise.resolve(handler(args));
    }
    else {
      return Promise.reject(new Error(`Command ${id} doesn't exist`));
    }
  }
}
