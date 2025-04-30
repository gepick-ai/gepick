import { AbstractView } from "@gepick/core/browser";
import { ICommandRegistry, ISelectionService, PostConstruct, lodashDebounce } from "@gepick/core/common";
import { BUILTIN_QUERY, INSTALLED_QUERY, IPluginSearchModel } from "../search";
import { IPluginRegistry } from "../plugin";
import { PluginRegistryViewContainer } from "./plugin-registry-view-container";

export class PluginRegistryView extends AbstractView<PluginRegistryViewContainer> {
  constructor(
    @IPluginRegistry protected pluginRegistry: IPluginRegistry,
    @IPluginSearchModel protected pluginSearchModel: IPluginSearchModel,
    @ISelectionService protected readonly selectionService: ISelectionService,
    @ICommandRegistry protected commandRegistry: ICommandRegistry,
  ) {
    super({
      widgetId: PluginRegistryViewContainer.ID,
      widgetName: PluginRegistryViewContainer.LABEL,
      defaultWidgetOptions: {
        area: 'left',
        rank: 500,
      },
    });
  }

  @PostConstruct()
  protected init(): void {
    const oneShotDisposable = this.pluginRegistry.onDidChange(lodashDebounce(() => {
      oneShotDisposable.dispose();
    }, 5000, { trailing: true }));
  }

  async onShellLayoutInit(): Promise<void> {
    await this.setupView({ activate: true });
  };

  async showBuiltinExtensions(): Promise<void> {
    await this.setupView({ activate: true });
    this.pluginSearchModel.query = BUILTIN_QUERY;
  }

  protected async showInstalledExtensions(): Promise<void> {
    await this.setupView({ activate: true });
    this.pluginSearchModel.query = INSTALLED_QUERY;
  }
}
