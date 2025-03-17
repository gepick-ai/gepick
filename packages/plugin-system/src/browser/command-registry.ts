import { IDisposable, toDisposable } from "@gepick/core/common";
import gepick from "@gepick/plugin-api"


export class CommandRegistry {
    cmdmap = new Map<string, gepick.Command>()
    private commands = new WeakMap<gepick.Command, any>();
  
    registerCommand(command: gepick.Command, p0: { execute: () => void, isEnabled: () => boolean, isVisible: () => boolean }): IDisposable {
      this.cmdmap.set(command.id, command)
      this.commands.set(command, p0)
      return toDisposable(() => { })
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