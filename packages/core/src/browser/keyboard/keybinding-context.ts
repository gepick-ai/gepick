import { Keybinding } from "@gepick/core/common";

export const KeybindingContext = Symbol('KeybindingContext');
export interface KeybindingContext {
  /**
   * The unique ID of the current context.
   */
  readonly id: string;

  isEnabled: (arg: Keybinding) => boolean;
}
export namespace KeybindingContexts {

  export const NOOP_CONTEXT: KeybindingContext = {
    id: 'noop.keybinding.context',
    isEnabled: () => true,
  };

  export const DEFAULT_CONTEXT: KeybindingContext = {
    id: 'default.keybinding.context',
    isEnabled: () => false,
  };
}
