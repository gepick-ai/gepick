import debounce from "p-debounce";
import { Emitter, WaitUntilEvent } from '../event';
import { InjectableService, Optional, createServiceDecorator } from '../dependency-injection';
import { DisposableStore, IDisposable, toDisposable } from '../lifecycle';
import { Command, CommandEvent, CommandHandler, WillExecuteCommandEvent } from "./command";
import { CommandService } from "./command-service";
import { ICommandProvider } from "./command-contribution";

/**
 * The command registry manages commands and handlers.
 */

export class CommandRegistry extends InjectableService implements CommandService {
  protected readonly _commands: { [id: string]: Command } = {};
  protected readonly _handlers: { [id: string]: CommandHandler[] } = {};

  protected readonly toUnregisterCommands = new Map<string, IDisposable>();

  // List of recently used commands.
  protected _recent: string[] = [];

  protected readonly onWillExecuteCommandEmitter = new Emitter<WillExecuteCommandEvent>();
  readonly onWillExecuteCommand = this.onWillExecuteCommandEmitter.event;

  protected readonly onDidExecuteCommandEmitter = new Emitter<CommandEvent>();
  readonly onDidExecuteCommand = this.onDidExecuteCommandEmitter.event;

  protected readonly onCommandsChangedEmitter = new Emitter<void>();
  readonly onCommandsChanged = this.onCommandsChangedEmitter.event;

  constructor(
        @Optional() @ICommandProvider protected readonly commandProvider: ICommandProvider,
  ) {
    super();
  }

  onStart(): void {
    const commands = this.commandProvider.getContributions();
    commands.forEach(command => this.registerCommand(command, command));
  }

  *getAllCommands(): IterableIterator<Readonly<Command & { handlers: CommandHandler[] }>> {
    for (const command of Object.values(this._commands)) {
      yield { ...command, handlers: this._handlers[command.id] ?? [] };
    }
  }

  /**
   * Register the given command and handler if present.
   *
   * Throw if a command is already registered for the given command identifier.
   */
  registerCommand(command: Command, handler?: CommandHandler): IDisposable {
    if (this._commands[command.id]) {
      console.warn(`A command ${command.id} is already registered.`);
      return { dispose() { } };
    }
    const toDispose = new DisposableStore();
    toDispose.add(this.doRegisterCommand(command));
    if (handler) {
      toDispose.add(this.registerHandler(command.id, handler));
    }
    this.toUnregisterCommands.set(command.id, toDispose);
    toDispose.add(toDisposable(() => this.toUnregisterCommands.delete(command.id)));
    return toDispose;
  }

  protected doRegisterCommand(command: Command): IDisposable {
    this._commands[command.id] = command;
    return {
      dispose: () => {
        delete this._commands[command.id];
      },
    };
  }

  /**
   * Unregister command from the registry
   *
   * @param command
   */
  unregisterCommand(command: Command): void;
  /**
   * Unregister command from the registry
   *
   * @param id
   */
  unregisterCommand(id: string): void;
  unregisterCommand(commandOrId: Command | string): void {
    const id = Command.is(commandOrId) ? commandOrId.id : commandOrId;
    const toUnregister = this.toUnregisterCommands.get(id);
    if (toUnregister) {
      toUnregister.dispose();
    }
  }

  /**
   * Register the given handler for the given command identifier.
   *
   * If there is already a handler for the given command
   * then the given handler is registered as more specific, and
   * has higher priority during enablement, visibility and toggle state evaluations.
   */
  registerHandler(commandId: string, handler: CommandHandler): IDisposable {
    let handlers = this._handlers[commandId];
    if (!handlers) {
      this._handlers[commandId] = handlers = [];
    }
    handlers.unshift(handler);
    this.fireDidChange();
    return {
      dispose: () => {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) {
          handlers.splice(idx, 1);
          this.fireDidChange();
        }
      },
    };
  }

  protected fireDidChange = debounce(() => this.doFireDidChange(), 0);

  protected doFireDidChange(): void {
    this.onCommandsChangedEmitter.fire();
  }

  /**
   * Test whether there is an active handler for the given command.
   */
  isEnabled(command: string, ...args: any[]): boolean {
    return typeof this.getActiveHandler(command, ...args) !== 'undefined';
  }

  /**
   * Test whether there is a visible handler for the given command.
   */
  isVisible(command: string, ...args: any[]): boolean {
    return typeof this.getVisibleHandler(command, ...args) !== 'undefined';
  }

  /**
   * Test whether there is a toggled handler for the given command.
   */
  isToggled(command: string, ...args: any[]): boolean {
    return typeof this.getToggledHandler(command, ...args) !== 'undefined';
  }

  /**
   * Execute the active handler for the given command and arguments.
   *
   * Reject if a command cannot be executed.
   */
  async executeCommand<T>(commandId: string, ...args: any[]): Promise<T | undefined> {
    const handler = this.getActiveHandler(commandId, ...args);
    if (handler) {
      await this.fireWillExecuteCommand(commandId, args);
      const result = await handler.execute(...args);
      this.onDidExecuteCommandEmitter.fire({ commandId, args });
      return result;
    }
    throw Object.assign(new Error(`The command '${commandId}' cannot be executed. There are no active handlers available for the command.`), { code: 'NO_ACTIVE_HANDLER' });
  }

  protected async fireWillExecuteCommand(commandId: string, args: any[] = []): Promise<void> {
    await WaitUntilEvent.fire(this.onWillExecuteCommandEmitter, { commandId, args }, 30000);
  }

  /**
   * Get a visible handler for the given command or `undefined`.
   */
  getVisibleHandler(commandId: string, ...args: any[]): CommandHandler | undefined {
    const handlers = this._handlers[commandId];
    if (handlers) {
      for (const handler of handlers) {
        try {
          if (!handler.isVisible || handler.isVisible(...args)) {
            return handler;
          }
        }
        catch (error) {
          console.error(error);
        }
      }
    }
    return undefined;
  }

  /**
   * Get an active handler for the given command or `undefined`.
   */
  getActiveHandler(commandId: string, ...args: any[]): CommandHandler | undefined {
    const handlers = this._handlers[commandId];
    if (handlers) {
      for (const handler of handlers) {
        try {
          if (!handler.isEnabled || handler.isEnabled(...args)) {
            return handler;
          }
        }
        catch (error) {
          console.error(error);
        }
      }
    }
    return undefined;
  }

  /**
   * Get a toggled handler for the given command or `undefined`.
   */
  getToggledHandler(commandId: string, ...args: any[]): CommandHandler | undefined {
    const handlers = this._handlers[commandId];
    if (handlers) {
      for (const handler of handlers) {
        try {
          if (handler.isToggled && handler.isToggled(...args)) {
            return handler;
          }
        }
        catch (error) {
          console.error(error);
        }
      }
    }
    return undefined;
  }

  /**
   * Returns with all handlers for the given command. If the command does not have any handlers,
   * or the command is not registered, returns an empty array.
   */
  getAllHandlers(commandId: string): CommandHandler[] {
    const handlers = this._handlers[commandId];
    return handlers ? handlers.slice() : [];
  }

  /**
   * Get all registered commands.
   */
  get commands(): Command[] {
    return Object.values(this._commands);
  }

  /**
   * Get a command for the given command identifier.
   */
  getCommand(id: string): Command | undefined {
    return this._commands[id];
  }

  /**
   * Get all registered commands identifiers.
   */
  get commandIds(): string[] {
    return Object.keys(this._commands);
  }

  /**
   * Get the list of recently used commands.
   */
  get recent(): Command[] {
    const commands: Command[] = [];
    for (const recentId of this._recent) {
      const command = this.getCommand(recentId);
      if (command) {
        commands.push(command);
      }
    }
    return commands;
  }

  /**
   * Set the list of recently used commands.
   * @param commands the list of recently used commands.
   */
  set recent(commands: Command[]) {
    this._recent = Array.from(new Set(commands.map(e => e.id)));
  }

  /**
   * Adds a command to recently used list.
   * Prioritizes commands that were recently executed to be most recent.
   *
   * @param recent a recent command, or array of recent commands.
   */
  addRecentCommand(recent: Command | Command[]): void {
    for (const recentCommand of Array.isArray(recent) ? recent : [recent]) {
      // Determine if the command currently exists in the recently used list.
      const index = this._recent.findIndex(commandId => commandId === recentCommand.id);
      // If the command exists, remove it from the array so it can later be placed at the top.
      if (index >= 0) { this._recent.splice(index, 1); }
      // Add the recent command to the beginning of the array (most recent).
      this._recent.unshift(recentCommand.id);
    }
  }

  /**
   * Clear the list of recently used commands.
   */
  clearCommandHistory(): void {
    this.recent = [];
  }
}
export const ICommandRegistry = createServiceDecorator<ICommandRegistry>(CommandRegistry.name);
export type ICommandRegistry = CommandRegistry;
