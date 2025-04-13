import { Contribution, IServiceContainer, InjectableService } from "@gepick/core/common";
import { IWidgetFactory, IWidgetManager, ViewContainerIdentifier } from "@gepick/core/browser";
import { IPluginsViewContainer, PluginsViewContainer } from "../plugin/plugin-view-container";
import { IPluginsWidget, PluginsWidget } from "../plugin/plugin-widget";
import { PluginsSourceOptions } from "../plugin/plugin-source";

export class CurViewContainerIdentifier extends ViewContainerIdentifier {
  static override name = ViewContainerIdentifier.name;

  override id: string = PluginsViewContainer.ID;
  override progressLocationId?: string = 'extensions';
}

@Contribution(IWidgetFactory)
export class PluginsWidgetFactory extends InjectableService {
  public readonly id = PluginsWidget.ID;

  createWidget(container: IServiceContainer) {
    return container.get<IPluginsWidget>(IPluginsWidget);
  }
}

@Contribution(IWidgetFactory)
export class PluginRegistryViewContainerFactory extends InjectableService {
  public readonly id = PluginsViewContainer.ID;

  constructor(
    @IWidgetManager protected readonly widgetManager: IWidgetManager,
  ) {
    super();
  }

  async createWidget(container: IServiceContainer) {
    const viewContainer = container.get<IPluginsViewContainer>(IPluginsViewContainer);
    const widgetManager = container.get<IWidgetManager>(IWidgetManager);
    for (const id of [
      PluginsSourceOptions.SEARCH_RESULT,
      PluginsSourceOptions.INSTALLED,
      PluginsSourceOptions.BUILT_IN,
    ]) {
      const widget = await widgetManager.getOrCreateWidget(PluginsWidget.ID, { id });
      viewContainer.addWidget(widget, {
        initiallyCollapsed: id === PluginsSourceOptions.BUILT_IN,
      });
    }
    return viewContainer;
  }
}
