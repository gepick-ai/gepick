import { IContributionProvider, Keybinding, createContribution } from "@gepick/core/common";
import { KeybindingContext } from "./keybinding-context";
import { KeybindingRegistry } from "./keybinding";

export const [IKeyBinding, IKeyBindingProvider] = createContribution<IKeyBinding>("KeyBinding");
/**
 * Allows extensions to contribute {@link common.Keybinding}s
 */
export interface IKeyBinding {

  /**
   * Registers keybindings.
   * @param keybindings the keybinding registry.
   */
  registerKeybindings: (keybindings: KeybindingRegistry) => void;
};

export interface IKeyBindingProvider extends IContributionProvider<IKeyBinding> {}

export const [IKeybindingContext, IKeybindingContextProvider] = createContribution("KeybindingContext");
export type IKeybindingContext = KeybindingContext;
export interface IKeybindingContextProvider extends IContributionProvider<IKeybindingContext> {}
