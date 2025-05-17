import { CancellationToken, IQuickInputService, InjectableService, QuickPickItem, QuickPickSeparator } from '@gepick/core/common';
import { IQuickAccessRegistry, QuickAccessContribution, QuickAccessProvider } from './quick-access';

export class QuickHelpService extends InjectableService implements QuickAccessProvider, QuickAccessContribution {
  static PREFIX = '?';

  @IQuickAccessRegistry protected quickAccessRegistry: IQuickAccessRegistry;

  @IQuickInputService protected quickInputService: IQuickInputService;

  getPicks(filter: string, token: CancellationToken): (QuickPickItem | QuickPickSeparator)[] {
    const { editorProviders, globalProviders } = this.getQuickAccessProviders();
    const result: (QuickPickItem | QuickPickSeparator)[] = editorProviders.length === 0 || globalProviders.length === 0
    // Without groups
      ? [
          ...(editorProviders.length === 0 ? globalProviders : editorProviders),
        ]

    // With groups
      : [
          { type: 'separator', label: 'global commands' },
          ...globalProviders,
          { type: 'separator', label: 'editor commands' },
          ...editorProviders,
        ];
    return result;
  }

  private getQuickAccessProviders(): { editorProviders: QuickPickItem[]; globalProviders: QuickPickItem[] } {
    const globalProviders: QuickPickItem[] = [];
    const editorProviders: QuickPickItem[] = [];

    const providers = this.quickAccessRegistry.getQuickAccessProviders();

    for (const provider of providers.sort((providerA, providerB) => providerA.prefix.localeCompare(providerB.prefix))) {
      if (provider.prefix === QuickHelpService.PREFIX) {
        continue; // exclude help which is already active
      }

      for (const helpEntry of provider.helpEntries) {
        const prefix = helpEntry.prefix || provider.prefix;
        const label = prefix || '\u2026';

        (helpEntry.needsEditor ? editorProviders : globalProviders).push({
          label,
          ariaLabel: `${label}, ${helpEntry.description}`,
          description: helpEntry.description,
          execute: () => this.quickInputService.open(prefix),
        });
      }
    }

    return { editorProviders, globalProviders };
  }

  registerQuickAccessProvider(): void {
    this.quickAccessRegistry.registerQuickAccessProvider(
      {
        getInstance: () => this,
        prefix: QuickHelpService.PREFIX,
        placeholder: 'Type "?" to get help on the actions you can take from here.',
        helpEntries: [{ description: 'Show all Quick Access Providers', needsEditor: false }],
      },
    );
  }
}
