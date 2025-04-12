import { AbstractViewContribution, ApplicationShell, IViewContribution } from "@gepick/core/browser";
import { Contribution, ISelectionService, PostConstruct } from "@gepick/core/common";
import { PluginsViewContainer } from "./plugin/plugin-view-container";
import { IPluginsModel } from "./plugin/plugin-model";
import { BUILTIN_QUERY, INSTALLED_QUERY } from "./search/plugin-registry-search-model";

@Contribution(IViewContribution)
export class PluginRegistryViewContribution extends AbstractViewContribution<any> {
  constructor(
    @IPluginsModel protected model: IPluginsModel,
    @ISelectionService protected readonly selectionService: ISelectionService,
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
  protected init(): void {}

  async initializeLayout(): Promise<void> {
    await this.openView({ activate: false });
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
