import { Contribution, IServiceContainer, InjectableService } from "@gepick/core/common";
import { IWidgetFactory } from "@gepick/core/browser";
import { IPluginsViewContainer, PluginsViewContainer } from "../plugin/plugin-view-container";

@Contribution(IWidgetFactory)
export class PluginRegistryViewContainerFactory extends InjectableService {
  public readonly id = PluginsViewContainer.ID;

  createWidget(container: IServiceContainer) {
    return container.get<IPluginsViewContainer>(IPluginsViewContainer);
  }
}
