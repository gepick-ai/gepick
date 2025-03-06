import gepick from "@gepick/plugin-api"
import { EXT, ICommandRegistryExt, ICommandRegistryMain } from "../../../common/plugin-api"

class CommandRegistry {
  cmdmap = new Map<string, gepick.Command>()
  private commands = new WeakMap<gepick.Command, any>();

  registerCommand(command: gepick.Command, p0: { execute: () => void, isEnabled: () => boolean, isVisible: () => boolean }): Disposable {
    this.cmdmap.set(command.id, command)
    this.commands.set(command, p0)
    return Disposable.create(() => { })
  }

  executeCommand<T>(id: string): PromiseLike<T | undefined> {
    const command = this.cmdmap.get(id);
    if (!command)
      return Promise.resolve(void 0)

    const handler = this.commands.get(command);
    if (!handler)
      return Promise.resolve(void 0)

    handler.execute()

    return Promise.resolve(void 0)
  }
}

export const commandRegistry = new CommandRegistry();
export class CommandRegistryMain implements ICommandRegistryMain {
  private ext: ICommandRegistryExt;
  private delegate: CommandRegistry = commandRegistry;
  private disposables = new Map<string, Disposable>();

  constructor(rpc: any) {
    // rpc如何通过EXT的相关标识获取到ext端的service？
    this.ext = rpc.getProxy(EXT.COMMAND_REGISTRY)
  }

  $registerCommand(command: gepick.Command): void {
    this.disposables.set(
      command.id,
      this.delegate.registerCommand(command, {
        execute: () => {
          this.ext.$executeCommand(command.id);
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

export class Disposable {
  private disposable: undefined | (() => void);

  constructor(func: () => void) {
    this.disposable = func;
  }

  /**
   * Dispose this object.
   */
  dispose(): void {
    if (this.disposable) {
      this.disposable();
      this.disposable = undefined;
    }
  }

  static create(func: () => void): Disposable {
    return new Disposable(func);
  }
}
