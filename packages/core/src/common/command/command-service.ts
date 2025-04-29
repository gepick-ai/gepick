import { Event } from '../event';
import { CommandEvent, WillExecuteCommandEvent } from "./command";

export const commandServicePath = '/services/commands';
export const CommandService = Symbol('CommandService');
/**
 * The command service should be used to execute commands.
 */
export interface CommandService {
  /**
   * Execute the active handler for the given command and arguments.
   *
   * Reject if a command cannot be executed.
   */
  executeCommand: <T>(command: string, ...args: any[]) => Promise<T | undefined>;
  /**
   * An event is emitted when a command is about to be executed.
   *
   * It can be used to install or activate a command handler.
   */
  readonly onWillExecuteCommand: Event<WillExecuteCommandEvent>;
  /**
   * An event is emitted when a command was executed.
   */
  readonly onDidExecuteCommand: Event<CommandEvent>;
}
