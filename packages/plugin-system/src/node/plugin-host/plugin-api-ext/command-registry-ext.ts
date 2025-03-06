import gepick from "@gepick/plugin-api";
import { Disposable, ICommandRegistryExt, ICommandRegistryMain, MAIN } from '@gepick/plugin-system/common';

export type Handler = <T>(...args: any[]) => T | PromiseLike<T>;

/**
 * TODO(@jaylenchen): 补充CommandRegistry主要是registerCommand和registerHandler
 */
export class CommandRegistryExt implements ICommandRegistryExt {
  private main: ICommandRegistryMain
  private commands = new Map<string, Handler>();

  constructor(rpc: any) {
    // rpc如何通过MAIN的相关标识获取到main端的service？
    this.main = rpc.getProxy(MAIN.COMMAND_REGISTRY);
  }

  $executeCommand<T>(id: string, ...args: any[]): PromiseLike<T> {
    if (this.commands.has(id)) {
      return this.executeLocalCommand(id, ...args);
    }
    else {
      return Promise.reject(new Error(`Command: ${id} does not exist.`));
    }
  }

  registerCommand(command: gepick.Command, handler?: Handler): Disposable {
    if (this.commands.has(command.id)) {
      throw new Error(`Command ${command.id} already exist`);
    }

    if (handler) {
      this.commands.set(command.id, handler);
    }
    this.main.$registerCommand(command);

    return Disposable.create(() => {
      this.main.$unregisterCommand(command.id);
    });
  }

  registerHandler(commandId: string, handler: Handler): Disposable {
    if (this.commands.has(commandId)) {
      throw new Error(`Command ${commandId} already has handler`);
    }

    this.commands.set(commandId, handler);

    return Disposable.create(() => {
      this.main.$unregisterCommand(commandId);
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
