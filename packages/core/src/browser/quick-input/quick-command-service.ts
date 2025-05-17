import { injectable } from 'inversify';
import { CancellationToken, Command, ICommandRegistry, IDisposable, InjectableService, KeySequence, QuickPickItem, QuickPicks, createServiceDecorator, filterItems, toDisposable } from '@gepick/core/common';
import { IKeybindingRegistry } from '../keyboard';
import { IContextKeyService } from '../menu';
import { WidgetUtilities } from '../widget';
import { ICorePreferences } from '../preferences';
import { IQuickAccessRegistry, QuickAccessContribution, QuickAccessProvider } from './quick-access';

export const quickCommand: Command = {
  id: 'workbench.action.showCommands',
};

export const CLEAR_COMMAND_HISTORY = Command.toDefaultLocalizedCommand({
  id: 'clear.command.history',
  label: 'Clear Command History',
});

export const CLOSE_QUICK_OPEN: Command = {
  id: 'workbench.action.closeQuickOpen',
};

export class QuickCommandService extends InjectableService implements QuickAccessContribution, QuickAccessProvider {
  static PREFIX = '>';

  @IContextKeyService protected readonly contextKeyService: IContextKeyService;
  @ICommandRegistry protected readonly commandRegistry: ICommandRegistry;
  @ICorePreferences protected readonly corePreferences: ICorePreferences;
  @IQuickAccessRegistry protected readonly quickAccessRegistry: IQuickAccessRegistry;
  @IKeybindingRegistry protected readonly keybindingRegistry: IKeybindingRegistry;

  // The list of exempted commands not to be displayed in the recently used list.
  readonly exemptedCommands: Command[] = [
    CLEAR_COMMAND_HISTORY,
  ];

  private recentItems: QuickPickItem[] = [];
  private otherItems: QuickPickItem[] = [];

  registerQuickAccessProvider(): void {
    this.quickAccessRegistry.registerQuickAccessProvider({
      getInstance: () => this,
      prefix: QuickCommandService.PREFIX,
      placeholder: '',
      helpEntries: [{ description: 'Quick Command', needsEditor: false }],
    });
  }

  reset(): void {
    const { recent, other } = this.getCommands();
    this.recentItems = [];
    this.otherItems = [];
    this.recentItems.push(...recent.map(command => this.toItem(command)));
    this.otherItems.push(...other.map(command => this.toItem(command)));
  }

  getPicks(filter: string, token: CancellationToken): QuickPicks {
    const items: QuickPicks = [];

    // Update the list of commands by fetching them from the registry.
    this.reset();
    const recentItems = filterItems(this.recentItems.slice(), filter);
    const otherItems = filterItems(this.otherItems.slice(), filter);

    if (recentItems.length > 0) {
      items.push({ type: 'separator', label: 'recently used' }, ...recentItems);
    }

    if (otherItems.length > 0) {
      if (recentItems.length > 0) {
        items.push({ type: 'separator', label: 'other commands' });
      }
      items.push(...otherItems);
    }
    return items;
  }

  toItem(command: Command): QuickPickItem {
    const label = (command.category) ? `${command.category}: ${command.label!}` : command.label!;
    const iconClasses = this.getItemIconClasses(command);
    const activeElement = window.document.activeElement as HTMLElement;

    const originalLabel = command.originalLabel || command.label!;
    const originalCategory = command.originalCategory || command.category;
    let detail: string | undefined = originalCategory ? `${originalCategory}: ${originalLabel}` : originalLabel;
    if (label === detail) {
      detail = undefined;
    }

    return {
      label,
      detail,
      iconClasses,
      alwaysShow: !!this.commandRegistry.getActiveHandler(command.id),
      keySequence: this.getKeybinding(command),
      execute: () => {
        activeElement.focus({ preventScroll: true });
        this.commandRegistry.executeCommand(command.id);
        this.commandRegistry.addRecentCommand(command);
      },
    };
  }

  private getKeybinding(command: Command): KeySequence | undefined {
    const keybindings = this.keybindingRegistry.getKeybindingsForCommand(command.id);
    if (!keybindings || keybindings.length === 0) {
      return undefined;
    }

    try {
      return this.keybindingRegistry.resolveKeybinding(keybindings[0]);
    }
    catch (error) {
      return undefined;
    }
  }

  private getItemIconClasses(command: Command): string[] | undefined {
    const toggledHandler = this.commandRegistry.getToggledHandler(command.id);
    if (toggledHandler) {
      return WidgetUtilities.codiconArray('check');
    }
    return undefined;
  }

  protected readonly contexts = new Map<string, string[]>();
  pushCommandContext(commandId: string, when: string): IDisposable {
    const contexts = this.contexts.get(commandId) || [];
    contexts.push(when);
    this.contexts.set(commandId, contexts);
    return toDisposable(() => {
      const index = contexts.indexOf(when);
      if (index !== -1) {
        contexts.splice(index, 1);
      }
    });
  }

  /**
     * Get the list of valid commands.
     *
     * @param commands the list of raw commands.
     * @returns the list of valid commands.
     */
  protected getValidCommands(raw: Command[]): Command[] {
    const valid: Command[] = [];
    raw.forEach((command) => {
      if (command.label) {
        const contexts = this.contexts.get(command.id);
        if (!contexts || contexts.some(when => this.contextKeyService.match(when))) {
          valid.push(command);
        }
      }
    });
    return valid;
  }

  /**
     * Get the list of recently used and other commands.
     *
     * @returns the list of recently used commands and other commands.
     */
  getCommands(): { recent: Command[]; other: Command[] } {
    // Get the list of recent commands.
    const recentCommands = this.commandRegistry.recent;

    // Get the list of all valid commands.
    const allCommands = this.getValidCommands(this.commandRegistry.commands);

    // Get the max history limit.
    const limit = this.corePreferences.get('workbench.commandPalette.history');

    // Build the list of recent commands.
    let rCommands: Command[] = [];
    if (limit > 0) {
      rCommands.push(...recentCommands.filter(r =>
        !this.exemptedCommands.some(c => Command.equals(r, c))
        && allCommands.some(c => Command.equals(r, c))),
      );
      if (rCommands.length > limit) {
        rCommands = rCommands.slice(0, limit);
      }
    }

    // Build the list of other commands.
    const oCommands = allCommands.filter(c => !rCommands.some(r => Command.equals(r, c)));

    // Normalize the list of recent commands.
    const recent = this.normalize(rCommands);

    // Normalize, and sort the list of other commands.
    const other = this.sort(
      this.normalize(oCommands),
    );

    return { recent, other };
  }

  /**
     * Normalizes a list of commands.
     * Normalization includes obtaining commands that have labels, are visible, and are enabled.
     *
     * @param commands the list of commands.
     * @returns the list of normalized commands.
     */
  private normalize(commands: Command[]): Command[] {
    return commands.filter((a: Command) => a.label && (this.commandRegistry.isVisible(a.id) && this.commandRegistry.isEnabled(a.id)));
  }

  /**
     * Sorts a list of commands alphabetically.
     *
     * @param commands the list of commands.
     * @returns the list of sorted commands.
     */
  private sort(commands: Command[]): Command[] {
    return commands.sort((a: Command, b: Command) => Command.compareCommands(a, b));
  }
}
export const IQuickCommandService = createServiceDecorator<IQuickCommandService>("QuickCommandService");
export type IQuickCommandService = QuickCommandService;
