import { Contribution, IServiceContainer, InjectableService } from "@gepick/core/common";
import { IWidgetFactory, IWidgetManager, ViewContainerIdentifier } from "@gepick/core/browser";
import { IPluginsViewContainer, PluginsViewContainer } from "../plugin/plugin-view-container";
import { IPluginsWidget, PluginsWidget, PluginsWidgetOptions } from "../plugin/plugin-widget";
import { IPluginsSourceOptions, PluginsSourceOptions } from "../plugin/plugin-source";
import { IPluginEditor, PluginEditor } from "../editor/plugin-editor";
import { IPluginOptions, Plugin, PluginOptions } from "../plugin/plugin-component";
import { IPluginsModel } from "../plugin/plugin-model";

export class CurViewContainerIdentifier extends ViewContainerIdentifier {
  static override name = ViewContainerIdentifier.name;

  override id: string = PluginsViewContainer.ID;
  override progressLocationId?: string = 'extensions';
}

@Contribution(IWidgetFactory)
export class PluginEditorFactory extends InjectableService {
  public readonly id = PluginEditor.ID;

  async createWidget(container: IServiceContainer, options: IPluginOptions) {
    container.rebind(PluginOptions.getServiceId()).toConstantValue(options);
    const extension = await container.get<IPluginsModel>(IPluginsModel).resolve(options.id);
    container.rebind(Plugin.getServiceId()).toConstantValue(extension);
    container.unbind(PluginEditor.getServiceId());
    container.bind(PluginEditor.getServiceId()).to(PluginEditor);
    return container.get<IPluginEditor>(IPluginEditor);
  }
}

@Contribution(IWidgetFactory)
export class PluginsWidgetFactory extends InjectableService {
  public readonly id = PluginsWidget.ID;

  createWidget(container: IServiceContainer, options: IPluginsSourceOptions) {
    container.rebind(PluginsWidgetOptions.getServiceId()).toConstantValue(options);
    container.rebind(PluginsWidget.getServiceId()).to(PluginsWidget).inRequestScope();

    const widget = container.get<IPluginsWidget>(IPluginsWidget);

    return widget;
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
