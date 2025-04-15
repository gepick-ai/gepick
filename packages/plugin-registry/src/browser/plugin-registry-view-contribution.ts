import { AbstractViewContribution, IViewContribution } from "@gepick/core/browser";
import { Contribution, ICommandRegistry, ISelectionService, PostConstruct, lodashDebounce } from "@gepick/core/common";
import { BUILTIN_QUERY, INSTALLED_QUERY } from "./search";
import { IPluginsModel, PluginsViewContainer } from "./plugin";

@Contribution(IViewContribution)
export class PluginRegistryViewContribution extends AbstractViewContribution<PluginsViewContainer> {
  constructor(
    @IPluginsModel protected model: IPluginsModel,
    @ISelectionService protected readonly selectionService: ISelectionService,
    @ICommandRegistry protected commandRegistry: ICommandRegistry,
  ) {
    super({
      widgetId: PluginsViewContainer.ID,
      widgetName: PluginsViewContainer.LABEL,
      defaultWidgetOptions: {
        area: 'left',
        rank: 500,
      },
    });
  }

  @PostConstruct()
  protected init(): void {
    const oneShotDisposable = this.model.onDidChange(lodashDebounce(() => {
      oneShotDisposable.dispose();
    }, 5000, { trailing: true }));
  }

  async initializeLayout(): Promise<void> {
    await this.openView({ activate: true });
  }

  protected async showBuiltinExtensions(): Promise<void> {
    await this.openView({ activate: true });
    this.model.search.query = BUILTIN_QUERY;
  }

  protected async showInstalledExtensions(): Promise<void> {
    await this.openView({ activate: true });
    this.model.search.query = INSTALLED_QUERY;
  }
}
