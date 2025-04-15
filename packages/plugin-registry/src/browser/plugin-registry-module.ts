import { Module, ServiceModule } from "@gepick/core/common";
import { SearchBar, SearchModel } from "./search";
import { Plugin, PluginFactory, PluginListOptions, PluginListWidget, PluginListWidgetFactory, PluginsModel, PluginsSource, PluginsViewContainer } from "./plugin";
import { PluginEditorManager, PluginEditorWidget, PluginEditorWidgetFactory } from "./editor";
import { CurViewContainerIdentifier, PluginRegistryViewContainerFactory } from "./plugin-registry-factory";
import { PluginRegistryViewContribution } from "./plugin-registry-view-contribution";

import "./style/index.css";

@Module({
  services: [
    PluginEditorWidget,
    PluginEditorWidgetFactory,
    PluginEditorManager,
    PluginListOptions,
    PluginsSource,
    SearchBar,
    SearchModel,
    PluginsModel,
    Plugin,
    PluginFactory,
    PluginListWidget,
    PluginListWidgetFactory,
    PluginsViewContainer,
    PluginRegistryViewContainerFactory,
    PluginRegistryViewContribution,
    CurViewContainerIdentifier,
  ],
})
export class PluginRegistryModule extends ServiceModule {}
