import { IDisposable, createServiceDecorator } from "@gepick/core/common"
import gepick from "@gepick/plugin-api"

// Command Main端
export const ICommandRegistryMain = createServiceDecorator("CommandRegistryMain")
export interface ICommandRegistryMain {
  $registerCommand: (command: gepick.Command) => void
  $unregisterCommand: (id: string) => void
  $executeCommand: <T>(id: string, args: any[]) => PromiseLike<T | undefined>
  $getCommands: () => PromiseLike<string[]>
}

export type Handler = <T>(...args: any[]) => T | PromiseLike<T>;

// Command Ext端
export const ICommandRegistryExt = createServiceDecorator("CommandRegistryExt")
export interface ICommandRegistryExt {
  $executeCommand: <T>(id: string, ...ars: any[]) => PromiseLike<T>
  registerCommand: (command: gepick.Command, handler?: Handler) => IDisposable
  registerHandler: (commandId: string, handler: Handler) => IDisposable
  executeCommand: <T>(id: string, ...args: any[]) => PromiseLike<T | undefined>
}
