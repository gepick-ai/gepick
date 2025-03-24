import gepick from "@gepick/plugin-api";
import { ICommandRegistryExt, ICommandRegistryMain, MainContext, PluginHostContext } from "@gepick/plugin-system/common/plugin-api";
import { Contribution, IDisposable, InjectableService } from "@gepick/core/common";
import { ILocalService } from "../../common/rpc-protocol";
import { IMainThreadRpcService } from "../main-thread-rpc";
import { CommandRegistry, commandRegistry } from "../command-registry";

@Contribution(ILocalService)
export class CommandRegistryMain extends InjectableService implements ICommandRegistryMain, ILocalService {
  #commandRegistryExt: ICommandRegistryExt;
  private delegate: CommandRegistry = commandRegistry;
  private disposables = new Map<string, IDisposable>();

  onRpcServiceInit(mainThreadRpcService: IMainThreadRpcService) {
    mainThreadRpcService.setLocalService(MainContext.CommandRegistry, this);
    this.#commandRegistryExt = mainThreadRpcService.getRemoteServiceProxy(PluginHostContext.CommandRegistry);
  }

  $registerCommand(command: gepick.Command): void {
    this.disposables.set(
      command.id,
      this.delegate.registerCommand(command, {
        execute: () => {
          this.#commandRegistryExt.$executeCommand(command.id);
        },
        isEnabled() { return true; },
        isVisible() { return true; },
      }),
    );
  }

  $unregisterCommand(id: string): void {
    const dis = this.disposables.get(id);
    if (dis) {
      dis.dispose();
      this.disposables.delete(id);
    }
  }

  $executeCommand<T>(id: string): PromiseLike<T | undefined> {
    try {
      return Promise.resolve(this.delegate.executeCommand<undefined>(id));
    }
    catch (e) {
      return Promise.reject(e);
    }
  }

  $getCommands(): PromiseLike<string[]> {
    throw new Error("Method not implemented.");
  }
}
