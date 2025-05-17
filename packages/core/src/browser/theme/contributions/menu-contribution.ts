import { CommonCommands, CommonMenus } from "@gepick/core/browser";
import { Contribution, IMenuContribution, InjectableService, MenuModelRegistry } from "@gepick/core/common";

@Contribution(IMenuContribution)
export class ThemeMenuContribution extends InjectableService implements IMenuContribution {
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(CommonMenus.MANAGE_SETTINGS_THEMES, {
      commandId: CommonCommands.SELECT_COLOR_THEME.id,
      order: '0',
    });
  }
}
