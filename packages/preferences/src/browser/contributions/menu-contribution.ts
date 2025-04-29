import { CommonCommands, CommonMenus } from "@gepick/core/browser";
import { Contribution, IMenuContribution, InjectableService, MenuModelRegistry } from "@gepick/core/common";
import { PreferenceMenus, PreferencesCommands } from "../util/preference-types";

@Contribution(IMenuContribution)
export class PreferencesMenuContribution extends InjectableService implements IMenuContribution {
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(CommonMenus.FILE_SETTINGS_SUBMENU_OPEN, {
      commandId: CommonCommands.OPEN_PREFERENCES.id,
      label: 'Settings',
      order: 'a10',
    });
    menus.registerMenuAction(CommonMenus.MANAGE_SETTINGS, {
      commandId: CommonCommands.OPEN_PREFERENCES.id,
      label: 'Settings',
      order: 'a10',
    });
    menus.registerMenuAction(PreferenceMenus.PREFERENCE_EDITOR_CONTEXT_MENU, {
      commandId: PreferencesCommands.RESET_PREFERENCE.id,
      label: PreferencesCommands.RESET_PREFERENCE.label,
      order: 'a',
    });
    menus.registerMenuAction(PreferenceMenus.PREFERENCE_EDITOR_COPY_ACTIONS, {
      commandId: PreferencesCommands.COPY_JSON_VALUE.id,
      label: PreferencesCommands.COPY_JSON_VALUE.label,
      order: 'b',
    });
    menus.registerMenuAction(PreferenceMenus.PREFERENCE_EDITOR_COPY_ACTIONS, {
      commandId: PreferencesCommands.COPY_JSON_NAME.id,
      label: PreferencesCommands.COPY_JSON_NAME.label,
      order: 'c',
    });
  }
}
