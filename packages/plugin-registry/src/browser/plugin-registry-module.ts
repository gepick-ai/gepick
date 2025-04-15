import { Module, ServiceModule } from "@gepick/core/common";
import { SearchBar, SearchModel } from "./search";
import { Plugin, PluginFactory, PluginListOptions, PluginListWidget, PluginListWidgetFactory, PluginsModel, PluginsSource } from "./plugin";
import { PluginEditorManager, PluginEditorWidget, PluginEditorWidgetFactory } from "./editor";
import { CurViewContainerIdentifier, PluginRegistryViewContainer, PluginRegistryViewContainerFactory, PluginRegistryViewContribution } from "./view-container";

import "./style/index.css";

@Module({
  services: [
    // #region Search
    SearchModel,
    SearchBar,
    // #endregion

    // #region Plugin
    Plugin,
    PluginFactory,
    PluginListOptions,
    PluginsSource,
    PluginsModel,
    PluginListWidget,
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
    PluginRegistryViewContribution,
    // #endregion
  ],
})
export class PluginRegistryModule extends ServiceModule {}
