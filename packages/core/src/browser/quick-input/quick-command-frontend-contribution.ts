import { CommandRegistry, IQuickInputService, InjectableService, MenuContribution, MenuModelRegistry, Optional } from '@gepick/core/common';
import { ConfirmDialog, Dialog, IConfirmDialogProps } from '../dialogs';
import { CommonMenus } from '../application';
import { KeybindingContribution, KeybindingRegistry } from '../keyboard';
import { CLEAR_COMMAND_HISTORY, CLOSE_QUICK_OPEN, IQuickCommandService, quickCommand } from './quick-command-service';

export class QuickCommandFrontendContribution extends InjectableService implements KeybindingContribution, MenuContribution {
  @Optional() @IQuickInputService protected readonly quickInputService: IQuickInputService;
  @Optional() @IQuickCommandService protected readonly quickCommandService: IQuickCommandService;

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(quickCommand, {
      execute: () => {
        this.quickInputService?.open('>');
      },
    });
    commands.registerCommand(CLEAR_COMMAND_HISTORY, {
      execute: async () => {
        const shouldClear = await new ConfirmDialog({
          title: 'Clear Command History',
          msg: 'Do you want to clear the history of recently used commands?',
          ok: 'Clear',
          cancel: Dialog.CANCEL,
        } as IConfirmDialogProps).open();
        if (shouldClear) {
          commands.clearCommandHistory();
        }
      },
    });
    commands.registerCommand(CLOSE_QUICK_OPEN, {
      execute: () => this.quickInputService?.hide(),
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(CommonMenus.VIEW_PRIMARY, {
      commandId: quickCommand.id,
      label: 'Command Palette...',
    });
    menus.registerMenuAction(CommonMenus.MANAGE_GENERAL, {
      commandId: quickCommand.id,
      label: 'Command Palette...',
      order: '0',
    });
  }

  registerKeybindings(keybindings: KeybindingRegistry): void {
    keybindings.registerKeybinding({
      command: quickCommand.id,
      keybinding: 'f1',
    });
    keybindings.registerKeybinding({
      command: quickCommand.id,
      keybinding: 'ctrlcmd+shift+p',
    });
    keybindings.registerKeybinding({
      command: CLOSE_QUICK_OPEN.id,
      keybinding: 'esc',
      when: 'inQuickOpen',
    });
    keybindings.registerKeybinding({
      command: CLOSE_QUICK_OPEN.id,
      keybinding: 'shift+esc',
      when: 'inQuickOpen',
    });
  }
}
