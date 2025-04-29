import { isObject } from '../types';
import { Event, WaitUntilEvent } from '../event';

/**
 * A command is a unique identifier of a function
 * which can be executed by a user via a keyboard shortcut,
 * a menu action or directly.
 */
export interface Command {
  /**
   * A unique identifier of this command.
   */
  id: string;
  /**
   * A label of this command.
   */
  label?: string;
  originalLabel?: string;
  /**
   * An icon class of this command.
   */
  iconClass?: string;
  /**
   * A short title used for display in menus.
   */
  shortTitle?: string;
  /**
   * A category of this command.
   */
  category?: string;
  originalCategory?: string;
}

export namespace Command {
  /* Determine whether object is a Command */
  export function is(arg: unknown): arg is Command {
    return isObject(arg) && 'id' in arg;
  }

  /** Utility function to easily translate commands */
  export function toLocalizedCommand(command: Command, _nlsLabelKey: string = command.id, _nlsCategoryKey?: string): Command {
    return {
      ...command,
      label: command.label,
      originalLabel: command.label,
      category: command.category,
      originalCategory: command.category,
    };
  }

  export function toDefaultLocalizedCommand(command: Command): Command {
    return {
      ...command,
      label: command.label,
      originalLabel: command.label,
      category: command.category,
      originalCategory: command.category,
    };
  }

  /** Comparator function for when sorting commands */
  export function compareCommands(a: Command, b: Command): number {
    if (a.label && b.label) {
      const aCommand = (a.category ? `${a.category}: ${a.label}` : a.label).toLowerCase();
      const bCommand = (b.category ? `${b.category}: ${b.label}` : b.label).toLowerCase();
      return (aCommand).localeCompare(bCommand);
    }
    else {
      return 0;
    }
  }

  /**
   * Determine if two commands are equal.
   *
   * @param a the first command for comparison.
   * @param b the second command for comparison.
   */
  export function equals(a: Command, b: Command): boolean {
    return (
      a.id === b.id
      && a.label === b.label
      && a.iconClass === b.iconClass
      && a.category === b.category
    );
  }
}

/**
 * A command handler is an implementation of a command.
 *
 * A command can have multiple handlers
 * but they should be active in different contexts,
 * otherwise first active will be executed.
 */
export interface CommandHandler {
  /**
   * Execute this handler.
   *
   * Don't call it directly, use `CommandService.executeCommand` instead.
   */
  execute: (...args: any[]) => any;
  /**
   * Test whether this handler is enabled (active).
   */
  isEnabled?: (...args: any[]) => boolean;
  onDidChangeEnabled?: Event<void>;
  /**
   * Test whether menu items for this handler should be visible.
   */
  isVisible?: (...args: any[]) => boolean;
  /**
   * Test whether menu items for this handler should be toggled.
   */
  isToggled?: (...args: any[]) => boolean;
}

export interface CommandEvent {
  commandId: string;
  args: any[];
}

export interface WillExecuteCommandEvent extends WaitUntilEvent, CommandEvent {
}
