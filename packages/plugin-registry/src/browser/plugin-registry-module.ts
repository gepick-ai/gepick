import { Module, ServiceModule } from "@gepick/core/common";
import { PluginSearchBarWidget, PluginSearchModel } from "./search";
import { Plugin, PluginFactory, PluginListModel, PluginListWidget, PluginListWidgetFactory, PluginListWidgetOptions, PluginRegistry } from "./plugin";
import { PluginEditorManager, PluginEditorWidget, PluginEditorWidgetFactory } from "./editor";
import { CurViewContainerIdentifier, PluginRegistryViewContainer, PluginRegistryViewContainerFactory, PluginRegistryView } from "./view";

import "./style/index.css";

@Module({
  services: [
    // #region Search
    PluginSearchModel,
    PluginSearchBarWidget,
    // #endregion

    // #region Plugin
    PluginRegistry,
    PluginFactory,
    PluginListWidgetFactory,
    // #endregion

    // #region Editor
    PluginEditorWidget,
    PluginEditorWidgetFactory,
    PluginEditorManager,
    // #endregion

    // #region ViewContainer
    CurViewContainerIdentifier,
    PluginRegistryViewContainer,
    PluginRegistryViewContainerFactory,
    PluginRegistryView,
    // #endregion
  ],
})
export class PluginRegistryModule extends ServiceModule {}
