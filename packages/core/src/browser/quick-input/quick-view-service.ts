import { CancellationToken, IDisposable, InjectableService, QuickPickItem, QuickPicks, filterItems, toDisposable } from '@gepick/core/common';
import { IContextKeyService } from '../menu';
import { IQuickAccessRegistry, QuickAccessContribution, QuickAccessProvider } from './quick-access';

export interface QuickViewItem {
  readonly label: string;
  readonly when?: string;
  readonly open: () => void;
}

export class QuickViewService extends InjectableService implements QuickAccessContribution, QuickAccessProvider {
  static PREFIX = 'view ';

  protected readonly items: (QuickPickItem & { when?: string })[] = [];
  private hiddenItemLabels = new Set<string | undefined>();

  @IQuickAccessRegistry protected readonly quickAccessRegistry: IQuickAccessRegistry;
  @IContextKeyService protected readonly contextKexService: IContextKeyService;

  registerItem(item: QuickViewItem): IDisposable {
    const quickOpenItem = {
      label: item.label,
      execute: () => item.open(),
      when: item.when,
    };
    this.items.push(quickOpenItem);
    this.items.sort((a, b) => a.label!.localeCompare(b.label!));

    return toDisposable(() => {
      const index = this.items.indexOf(quickOpenItem);
      if (index !== -1) {
        this.items.splice(index, 1);
      }
    });
  }

  hideItem(label: string): void {
    this.hiddenItemLabels.add(label);
  }

  showItem(label: string): void {
    this.hiddenItemLabels.delete(label);
  }

  registerQuickAccessProvider(): void {
    this.quickAccessRegistry.registerQuickAccessProvider({
      getInstance: () => this,
      prefix: QuickViewService.PREFIX,
      placeholder: '',
      helpEntries: [{ description: 'Open View', needsEditor: false }],
    });
  }

  getPicks(filter: string, token: CancellationToken): QuickPicks {
    const items = this.items.filter(item =>
      (item.when === undefined || this.contextKexService.match(item.when))
      && (!this.hiddenItemLabels.has(item.label)),
    );
    return filterItems(items, filter);
  }
}
